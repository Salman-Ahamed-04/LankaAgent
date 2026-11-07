import os
import json
import re
import datetime
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from app.agent.state import LankaAgentState, AgentLogStep
from app.agent.tools.fare_calculator import calculate_fair_fare
from app.agent.tools.disruption_sentinel import check_route_disruptions
from app.agent.tools.local_host_bridge import match_and_dispatch_local_hosts

from dotenv import load_dotenv
from app.key_resolver import load_gemini_key

# Load environment variables from .env
load_dotenv()

MODEL_CANDIDATES = ["gemini-3.5-flash-lite", "gemini-3.5-flash"]

def get_gemini_client():
    api_key = load_gemini_key()
    if not api_key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key.strip())
    except Exception as e:
        print("Gemini client initialization error:", e)
        return None

def call_gemini(client, prompt: str) -> Optional[str]:
    """Invokes Google Gemini with automatic fallback across reliable flash models."""
    if not client:
        return None
    for model_name in MODEL_CANDIDATES:
        try:
            resp = client.models.generate_content(model=model_name, contents=prompt)
            if resp and resp.text:
                return resp.text.strip()
        except Exception as e:
            print(f"Gemini call on {model_name} failed: {e}")
            continue
    return None

def add_log(state: LankaAgentState, agent: str, action: str, details: str):
    now = datetime.datetime.now().strftime("%H:%M:%S")
    step = {
        "step_id": f"step-{len(state.get('thought_trace', [])) + 1}",
        "agent_name": agent,
        "action": action,
        "details": details,
        "timestamp": now
    }
    state["thought_trace"].append(step)

# Node 1: Intent & Location Extraction Supervisor
def supervisor_node(state: LankaAgentState) -> Dict[str, Any]:
    query = state.get("user_query", "").strip()
    thought_trace = state.get("thought_trace", [])
    state["thought_trace"] = thought_trace

    add_log(state, "SupervisorAgent", "Analyzing Traveler Intent", f"Parsing query: '{query}'")

    client = get_gemini_client()
    intent_parsed = False

    # Attempt neural intent parsing via Gemini
    if client:
        intent_prompt = f"""You are the Supervisor Agent of LankaAgent, an autonomous AI travel system for Sri Lanka.
Analyze the user's travel inquiry: "{query}"

Respond ONLY with a valid JSON object (no extra commentary, no markdown codeblocks):
{{
  "intent": "route_transit" | "fare_inquiry" | "disruption_check" | "homestay_search" | "general_tourism",
  "origin": "<Sri Lankan city/town or null>",
  "destination": "<Sri Lankan city/town or null>",
  "vehicle_type": "tuk_tuk" | "sedan" | "van" | null,
  "quoted_fare_lkr": <number or null>,
  "needs_fare_check": true | false,
  "needs_disruption_check": true | false,
  "needs_host_search": true | false,
  "brief_intent_summary": "<One concise sentence describing traveler goal>"
}}"""
        raw_res = call_gemini(client, intent_prompt)
        if raw_res:
            try:
                # Strip markdown codeblocks if model included them
                clean_json = raw_res
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```")[1].split("```")[0].strip()

                data = json.loads(clean_json)
                state["intent"] = data.get("intent", "general_tourism")
                state["origin"] = data.get("origin") or state.get("origin")
                state["destination"] = data.get("destination") or state.get("destination")
                state["vehicle_type"] = data.get("vehicle_type") or "tuk_tuk"
                state["quoted_fare"] = data.get("quoted_fare_lkr")
                state["needs_fare_check"] = bool(data.get("needs_fare_check"))
                state["needs_disruption_check"] = bool(data.get("needs_disruption_check"))
                state["needs_host_search"] = bool(data.get("needs_host_search"))
                
                summary = data.get("brief_intent_summary") or state["intent"]
                add_log(state, "SupervisorAgent", "Neural Intent Analyzed", f"{summary}")
                intent_parsed = True
            except Exception as e:
                print("Failed to parse Gemini intent JSON:", e)

    # Heuristic fallback if Gemini not available or JSON parse failed
    if not intent_parsed:
        q_lower = query.lower()
        hubs = ["colombo", "kandy", "nuwara eliya", "ella", "sigiriya", "dambulla", "mirissa", "galle", "belihuloya", "meemure", "yala", "negombo", "jaffna"]
        detected = [h for h in hubs if h in q_lower]

        origin = state.get("origin")
        dest = state.get("destination")

        if len(detected) >= 2:
            origin = detected[0]
            dest = detected[1]
        elif len(detected) == 1:
            if not dest:
                dest = detected[0]
            elif not origin:
                origin = detected[0]

        # Extract numerical fare if user mentioned price
        nums = re.findall(r'(?:rs\.?|lkr|\$)?\s*(\d{3,6})', q_lower)
        quoted = None
        if nums:
            valid_nums = [float(n) for n in nums if n not in ["2024", "2025", "2026"]]
            if valid_nums:
                quoted = valid_nums[0]

        # Vehicle detection
        vehicle = "tuk_tuk"
        if "van" in q_lower or "kdh" in q_lower:
            vehicle = "van"
        elif "car" in q_lower or "sedan" in q_lower or "prius" in q_lower:
            vehicle = "sedan"

        has_corridor = bool(origin and dest)
        has_fare_ask = bool(quoted or "fare" in q_lower or "meter" in q_lower or "scam" in q_lower or "price" in q_lower or "cost" in q_lower)
        has_disrupt_ask = bool("train" in q_lower or "delay" in q_lower or "weather" in q_lower or "landslide" in q_lower or "rail" in q_lower)
        has_host_ask = bool("stay" in q_lower or "homestay" in q_lower or "village" in q_lower or "hotel" in q_lower or "food" in q_lower)

        state["origin"] = origin
        state["destination"] = dest
        state["vehicle_type"] = vehicle
        state["quoted_fare"] = quoted
        state["needs_fare_check"] = has_corridor or (dest and has_fare_ask)
        state["needs_disruption_check"] = has_corridor or has_disrupt_ask
        state["needs_host_search"] = has_host_ask or bool(dest)
        state["intent"] = "route_transit" if has_corridor else ("fare_inquiry" if has_fare_ask else "general_tourism")

        if origin and dest:
            add_log(state, "SupervisorAgent", "Corridor Established", f"{origin.capitalize()} ➔ {dest.capitalize()}")
        elif dest:
            add_log(state, "SupervisorAgent", "Destination Focus", f"Target destination: {dest.capitalize()}")
        else:
            add_log(state, "SupervisorAgent", "General Inquiry", "Broad Sri Lanka travel intelligence request.")

    return state

# Node 2: Disruption & Hazard Sentinel
def disruption_node(state: LankaAgentState) -> Dict[str, Any]:
    if not state.get("needs_disruption_check") or not (state.get("origin") or state.get("destination")):
        add_log(state, "DisruptionSentinel", "Standby Mode", "Transit hazard scanning bypassed for general inquiry.")
        return state

    origin = state.get("origin") or "colombo"
    dest = state.get("destination") or origin

    add_log(state, "DisruptionSentinel", "Scanning Live Feeds", f"Auditing rail lines, weather alerts, and slips for {origin.capitalize()} -> {dest.capitalize()}...")
    disr_result = check_route_disruptions(origin, dest)

    state["active_disruptions"] = disr_result.get("matched_alerts", [])
    state["suggested_reroute"] = disr_result.get("reroute_proposal")

    if disr_result.get("has_disruption"):
        add_log(state, "DisruptionSentinel", "Active Hazard Detected!", f"Found {len(state['active_disruptions'])} incident(s). Generated contingency re-routing plan.")
        state["requires_human_approval"] = True
    else:
        add_log(state, "DisruptionSentinel", "Route Clear", "No active track or weather obstructions found in corridor.")

    return state

# Node 3: Fair-Fare Calculator
def fare_sentinel_node(state: LankaAgentState) -> Dict[str, Any]:
    if not state.get("needs_fare_check") or not (state.get("origin") or state.get("destination")):
        add_log(state, "FareSentinel", "Standby Mode", "Fare calculation bypassed for non-transit inquiry.")
        return state

    origin = state.get("origin") or "colombo"
    dest = state.get("destination") or origin
    vehicle = state.get("vehicle_type") or "tuk_tuk"
    quoted = state.get("quoted_fare")

    add_log(state, "FareSentinel", "Computing Gazetted Fair Fare", f"Calculating CPC fuel index & terrain factors for {vehicle} ({origin.capitalize()} to {dest.capitalize()})...")
    fare_card = calculate_fair_fare(origin, dest, vehicle, quoted_scam_fare=quoted)
    state["fare_card"] = fare_card

    if fare_card.get("potential_savings_lkr"):
        add_log(state, "FareSentinel", "Price-Gouging Flagged!", f"Driver asked for LKR {quoted:,.0f}, but fair meter rate is LKR {fare_card['estimated_fair_fare_lkr']:,} (Overcharge: {fare_card['overcharge_pct']}%). Generated bilingual scripts.")
    else:
        add_log(state, "FareSentinel", "Fare Verified", f"Estimated fair price: LKR {fare_card['estimated_fair_fare_lkr']:,} (~${fare_card['estimated_fair_fare_usd']}).")

    return state

# Node 4: Local Host & Micro-Economy Dispatch
def local_host_node(state: LankaAgentState) -> Dict[str, Any]:
    if not state.get("needs_host_search") or not (state.get("destination") or state.get("origin")):
        add_log(state, "LocalHostBridge", "Standby Mode", "Homestay dispatch idle.")
        return state

    loc = state.get("destination") or state.get("origin") or "ella"
    add_log(state, "LocalHostBridge", "Querying Vetted Rural Hosts", f"Searching registered village homestays around {loc.capitalize()}...")
    host_result = match_and_dispatch_local_hosts(loc, traveler_needs="Authentic local stay, food, and fair local transport")
    state["recommended_hosts"] = host_result.get("hosts", [])

    if state["recommended_hosts"]:
        add_log(state, "LocalHostBridge", "Generated Trilingual Dispatches", f"Prepared {len(state['recommended_hosts'])} direct Sinhala/Tamil dispatch notes with zero middleman commission.")
    return state

# Node 5: Synthesizer & Response Assembler
def synthesizer_node(state: LankaAgentState) -> Dict[str, Any]:
    query = state.get("user_query", "")
    origin = state.get("origin")
    dest = state.get("destination")
    fare = state.get("fare_card")
    disruptions = state.get("active_disruptions", [])
    reroute = state.get("suggested_reroute")
    hosts = state.get("recommended_hosts", [])

    client = get_gemini_client()

    # If Gemini is available, generate dynamic, authentic, intelligent response
    if client:
        add_log(state, "GeminiNeuralSynthesis", "Dynamic Synthesis Active", "Invoking Google Gemini API to analyze query and deliver personalized intelligence...")

        tool_facts = []
        if fare:
            tool_facts.append(f"FAIR FARE ESTIMATE ({fare['origin']} -> {fare['destination']}): Distance {fare['distance_km']} km, Official Fair Meter: LKR {fare['estimated_fair_fare_lkr']:,} (~${fare['estimated_fair_fare_usd']} USD).")
            if fare.get("quoted_scam_fare_lkr") and fare.get("potential_savings_lkr"):
                tool_facts.append(f"OVERCHARGE ALERT: Driver quoted LKR {int(fare['quoted_scam_fare_lkr']):,}. Potential savings: LKR {int(fare['potential_savings_lkr']):,} ({fare['overcharge_pct']}% overcharge).")
                tool_facts.append(f"Sinhala Negotiation Phrase: \"{fare['bilingual_phrase_sinhala']}\" (Pronunciation: {fare['bilingual_translit_sinhala']})")
                tool_facts.append(f"Tamil Negotiation Phrase: \"{fare['bilingual_phrase_tamil']}\" (Pronunciation: {fare['bilingual_translit_tamil']})")

        if disruptions:
            tool_facts.append("ACTIVE ROUTE HAZARDS:")
            for d in disruptions:
                tool_facts.append(f"- {d['event']} at {d['location']}: Status '{d['status']}'. Agent Recommendation: {d['agent_recommendation']}")
            if reroute:
                tool_facts.append(f"CONTINGENCY REROUTE: {json.dumps(reroute)}")

        if hosts:
            tool_facts.append("VETTED RURAL HOMESTAYS & HOSTS:")
            for h in hosts[:2]:
                tool_facts.append(f"- {h['business_name']} ({h['location']}) | Host: {h.get('host_name', h.get('name'))} | Rate: LKR {h.get('rate_lkr', h.get('rate_lkr_per_night', 6000)):,}/night (~${h.get('rate_usd_approx', 20)}). Features: {h.get('bio_english', '')}")

        tool_summary = "\n".join(tool_facts) if tool_facts else "No specific transit tool facts needed for this inquiry."

        synthesis_prompt = f"""You are LankaAgent, an elite Sri Lankan tourism logistics and autonomous AI travel broker.
The traveler asked: "{query}"

Internal Verified Tool Findings (if applicable):
{tool_summary}

Instructions:
1. Directly and thoroughly answer the traveler's question with authentic, expert Sri Lankan knowledge.
2. If the user asks general questions (attractions, food, culture, packing, safety, SIM cards, recommendations, itinerary), provide rich, actionable, and helpful local advice.
3. If tool facts (fares, disruptions, homestays, negotiation phrases) were provided above, integrate ALL numbers and Sinhala/Tamil phrases accurately and prominently.
4. Greet the traveler warmly (Ayubowan! 🙏) when appropriate.
5. Format your response cleanly using GitHub-flavored Markdown (bolding, headers, bullet points).
6. Do NOT output generic canned text or fake train slips if none were detected. Focus squarely on what the traveler actually asked.
"""
        res_text = call_gemini(client, synthesis_prompt)
        if res_text:
            state["final_response"] = res_text
            add_log(state, "GeminiNeuralSynthesis", "Intelligence Delivered", "Personalized response formulated and verified via Google Gemini API.")
            return state

    # Fallback deterministic builder if Gemini client is unavailable
    response_parts = []
    response_parts.append(f"### 🌴 LankaAgent Travel Intelligence Brief\n")

    if disruptions:
        response_parts.append("🚨 **CRITICAL TRANSIT ADVISORY & RE-ROUTING**")
        for d in disruptions:
            response_parts.append(f"- **Incident:** {d['event']} ({d['location']})")
            response_parts.append(f"- **Current Status:** {d['status']}")
            response_parts.append(f"- **Agent Strategy:** {d['agent_recommendation']}")
        
        if reroute:
            response_parts.append(f"\n🔄 **Proposed Contingency Route:**")
            for leg in reroute.get("alternate_legs", []):
                if "from" in leg:
                    response_parts.append(f"  • **{leg['mode']}:** {leg['from']} ➔ {leg['to']} ({leg.get('duration')}) [Via {leg.get('via', 'direct')}]")
                else:
                    response_parts.append(f"  • **{leg['mode']}:** {leg.get('activity')} ({leg.get('duration')})")
            response_parts.append(f"*Estimated time impact:* `+{reroute.get('time_impact_min')} mins` | *Estimated transfer cost:* `LKR {reroute.get('cost_impact_lkr'):,}`\n")

    if fare:
        response_parts.append("🏷️ **ANTI-GOUGING FAIR FARE ESTIMATE**")
        response_parts.append(f"- **Corridor:** {fare['origin']} ➔ {fare['destination']} (~{fare['distance_km']} km)")
        response_parts.append(f"- **Official Fair Fare:** **LKR {fare['estimated_fair_fare_lkr']:,}** (~${fare['estimated_fair_fare_usd']} USD)")
        
        if fare.get("quoted_scam_fare_lkr") and fare.get("potential_savings_lkr"):
            quoted_val = int(fare['quoted_scam_fare_lkr'])
            savings_val = int(fare['potential_savings_lkr'])
            response_parts.append(f"- ⚠️ **Tourist Alert:** Driver quote of LKR {quoted_val:,} is **{fare['overcharge_pct']}% above fair meter rate**! Potential savings: **LKR {savings_val:,}**.")
            response_parts.append("\n🗣️ **Show or Play This to the Driver:**")
            response_parts.append(f"  🇱🇰 **Sinhala:** \"{fare['bilingual_phrase_sinhala']}\" *(Pronunciation: {fare['bilingual_translit_sinhala']})*")
            response_parts.append(f"  🇱🇰 **Tamil:** \"{fare['bilingual_phrase_tamil']}\" *(Pronunciation: {fare['bilingual_translit_tamil']})*\n")

    if hosts:
        response_parts.append("🏡 **DIRECT LOCAL COMMUNITY EMPOWERMENT**")
        for h in hosts[:2]:
            h_name = h.get('business_name', 'Local Homestay')
            loc = h.get('location', '')
            rate = h.get('rate_lkr', h.get('rate_lkr_per_night', 6000))
            response_parts.append(f"- **{h_name}** ({loc}) | Rate: **LKR {rate:,}/night**")

    if not disruptions and not fare and not hosts:
        response_parts.append(f"Ayubowan! LankaAgent received your inquiry: *\"{query}\"*.\n")
        response_parts.append("Please specify your origin and destination (e.g., *'Kandy to Ella'*) or quote a driver's fare to calculate official fuel-indexed fair meter rates, live disruption re-routing, and vetted rural homestays.")

    state["final_response"] = "\n".join(response_parts)
    add_log(state, "Synthesizer", "Completed", "Finalized deterministic travel brief.")
    return state

# Assemble LangGraph Workflow
def build_lanka_agent_graph():
    workflow = StateGraph(LankaAgentState)

    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("disruptions", disruption_node)
    workflow.add_node("fare_sentinel", fare_sentinel_node)
    workflow.add_node("local_hosts", local_host_node)
    workflow.add_node("synthesizer", synthesizer_node)

    workflow.set_entry_point("supervisor")
    workflow.add_edge("supervisor", "disruptions")
    workflow.add_edge("disruptions", "fare_sentinel")
    workflow.add_edge("fare_sentinel", "local_hosts")
    workflow.add_edge("local_hosts", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()

# Global compiled instance
lanka_agent_app = build_lanka_agent_graph()

def run_agent(query: str, origin: str = None, destination: str = None) -> LankaAgentState:
    initial_state: LankaAgentState = {
        "messages": [{"role": "user", "content": query}],
        "user_query": query,
        "origin": origin,
        "destination": destination,
        "active_disruptions": [],
        "fare_card": None,
        "recommended_hosts": [],
        "suggested_reroute": None,
        "thought_trace": [],
        "final_response": "",
        "requires_human_approval": False
    }
    return lanka_agent_app.invoke(initial_state)
