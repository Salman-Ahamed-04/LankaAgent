import os
import json
import datetime
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from app.agent.state import LankaAgentState, AgentLogStep
from app.agent.tools.fare_calculator import calculate_fair_fare
from app.agent.tools.disruption_sentinel import check_route_disruptions
from app.agent.tools.local_host_bridge import match_and_dispatch_local_hosts

# Try to import Gemini SDK if available
try:
    from google import genai
    from google.genai import types
    has_gemini = True
except ImportError:
    has_gemini = False

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
    query = state.get("user_query", "").lower()
    thought_trace = state.get("thought_trace", [])
    state["thought_trace"] = thought_trace

    add_log(state, "SupervisorAgent", "Analyzing Traveler Intent", f"Parsing query: '{state.get('user_query')}'")

    # Extract common Sri Lanka hubs
    hubs = ["colombo", "kandy", "nuwara eliya", "ella", "sigiriya", "dambulla", "mirissa", "galle", "belihuloya", "meemure", "yala"]
    detected = [h for h in hubs if h in query]

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

    # Defaults if none specified
    if not origin and not dest:
        origin = "kandy"
        dest = "ella"
    elif not origin:
        origin = "kandy"
    elif not dest:
        dest = "ella"

    state["origin"] = origin
    state["destination"] = dest

    add_log(state, "SupervisorAgent", "Entities Bound", f"Corridor established: {origin.capitalize()} -> {dest.capitalize()}")
    return state

# Node 2: Disruption & Hazard Sentinel
def disruption_node(state: LankaAgentState) -> Dict[str, Any]:
    origin = state.get("origin", "kandy")
    dest = state.get("destination", "ella")

    add_log(state, "DisruptionSentinel", "Scanning Live Feeds", f"Auditing rail lines, weather alerts, and road slips for {origin} -> {dest}...")
    disr_result = check_route_disruptions(origin, dest)

    state["active_disruptions"] = disr_result.get("matched_alerts", [])
    state["suggested_reroute"] = disr_result.get("reroute_proposal")

    if disr_result.get("has_disruption"):
        add_log(state, "DisruptionSentinel", "Active Hazard Detected!", f"Found {len(state['active_disruptions'])} incident(s). Triggered autonomous reroute planning.")
        state["requires_human_approval"] = True
    else:
        add_log(state, "DisruptionSentinel", "Route Clear", "No active track or weather obstructions found in corridor.")

    return state

# Node 3: Fair-Fare Calculator
def fare_sentinel_node(state: LankaAgentState) -> Dict[str, Any]:
    query = state.get("user_query", "").lower()
    origin = state.get("origin", "kandy")
    dest = state.get("destination", "ella")

    # Detect if user mentioned an offered or quoted price (e.g. "driver asked for 6000" or "is 5000 fair?")
    import re
    quoted = None
    nums = re.findall(r'(?:rs\.?|lkr|\$)?\s*(\d{3,6})', query)
    if nums:
        # filter out years like 2026
        valid_nums = [float(n) for n in nums if n not in ["2024", "2025", "2026"]]
        if valid_nums:
            quoted = valid_nums[0]

    # Vehicle type detection
    vehicle = "tuk_tuk"
    if "van" in query or "kdh" in query:
        vehicle = "van"
    elif "car" in query or "sedan" in query or "prius" in query:
        vehicle = "sedan"

    add_log(state, "FareSentinel", "Computing Gazetted Fair Fare", f"Calculating CPC fuel index & terrain factors for {vehicle} ({origin} to {dest})...")
    fare_card = calculate_fair_fare(origin, dest, vehicle, quoted_scam_fare=quoted)
    state["fare_card"] = fare_card

    if fare_card.get("potential_savings_lkr"):
        add_log(state, "FareSentinel", "Price-Gouging Flagged!", f"Driver asked for LKR {quoted:,.0f}, but fair meter rate is LKR {fare_card['estimated_fair_fare_lkr']:,} (Overcharge: {fare_card['overcharge_pct']}%). Generated bilingual counter-offer script.")
    else:
        add_log(state, "FareSentinel", "Fare Verified", f"Estimated fair price: LKR {fare_card['estimated_fair_fare_lkr']:,} (~${fare_card['estimated_fair_fare_usd']}).")

    return state

# Node 4: Local Host & Micro-Economy Dispatch
def local_host_node(state: LankaAgentState) -> Dict[str, Any]:
    dest = state.get("destination", "ella")
    query = state.get("user_query", "")

    add_log(state, "LocalHostBridge", "Querying Vetted Rural Hosts", f"Searching registered village homestays and community co-ops around {dest.capitalize()}...")
    host_result = match_and_dispatch_local_hosts(dest, traveler_needs="Authentic local stay, food, and fair local transport")
    state["recommended_hosts"] = host_result.get("hosts", [])

    add_log(state, "LocalHostBridge", "Generated Trilingual Dispatches", f"Prepared {len(state['recommended_hosts'])} direct Sinhala/Tamil dispatch notes with zero middleman commission.")
    return state

# Node 5: Synthesizer & Response Assembler
def synthesizer_node(state: LankaAgentState) -> Dict[str, Any]:
    add_log(state, "Synthesizer", "Generating Final Itinerary Brief", "Compiling disruption alerts, anti-gouging cards, and direct host contacts...")

    origin = state.get("origin", "").capitalize()
    dest = state.get("destination", "").capitalize()
    fare = state.get("fare_card")
    disruptions = state.get("active_disruptions", [])
    reroute = state.get("suggested_reroute")
    hosts = state.get("recommended_hosts", [])

    response_parts = []
    response_parts.append(f"### 🌴 LankaAgent Strategic Travel & Logistics Brief: **{origin} ➔ {dest}**\n")

    # Disruption section
    if disruptions:
        response_parts.append("🚨 **CRITICAL TRANSIT ADVISORY & RE-ROUTING**")
        for d in disruptions:
            response_parts.append(f"- **Incident:** {d['event']} ({d['location']})")
            response_parts.append(f"- **Current Status:** {d['status']}")
            response_parts.append(f"- **Agent Strategy:** {d['agent_recommendation']}")
        
        if reroute:
            response_parts.append(f"\n🔄 **Proposed Autonomous Contingency Route:**")
            for leg in reroute.get("alternate_legs", []):
                if "from" in leg:
                    response_parts.append(f"  • **{leg['mode']}:** {leg['from']} ➔ {leg['to']} ({leg.get('duration')}) [Via {leg.get('via', 'direct')}]")
                else:
                    response_parts.append(f"  • **{leg['mode']}:** {leg.get('activity')} ({leg.get('duration')})")
            response_parts.append(f"*Estimated time impact:* `+{reroute.get('time_impact_min')} mins` | *Estimated transfer cost:* `LKR {reroute.get('cost_impact_lkr'):,}`\n")
    else:
        response_parts.append("✅ **Route Status:** All primary corridors, railways, and weather advisories are **CLEAR**.\n")

    # Fare card section
    if fare:
        response_parts.append("🏷️ **ANTI-GOUGING FAIR FARE ESTIMATE**")
        response_parts.append(f"- **Distance & Terrain:** ~{fare['distance_km']} km ({fare['vehicle_type'].replace('_', ' ').title()}) | Terrain Multiplier: `x{fare['terrain_factor']}`")
        response_parts.append(f"- **Official Fair Fare:** **LKR {fare['estimated_fair_fare_lkr']:,}** (~${fare['estimated_fair_fare_usd']} USD)")
        
        if fare.get("quoted_scam_fare_lkr") and fare.get("potential_savings_lkr"):
            quoted_val = int(fare['quoted_scam_fare_lkr'])
            savings_val = int(fare['potential_savings_lkr'])
            response_parts.append(f"- ⚠️ **Tourist Alert:** Driver quote of LKR {quoted_val:,} is **{fare['overcharge_pct']}% above fair rate**! Potential savings: **LKR {savings_val:,}**.")
            response_parts.append("\n🗣️ **Show or Play This to the Driver:**")
            response_parts.append(f"  🇱🇰 **Sinhala:** \"{fare['bilingual_phrase_sinhala']}\" *(Pronunciation: {fare['bilingual_translit_sinhala']})*")
            response_parts.append(f"  🇱🇰 **Tamil:** \"{fare['bilingual_phrase_tamil']}\" *(Pronunciation: {fare['bilingual_translit_tamil']})*\n")

    # Community hosts section
    if hosts:
        response_parts.append("🏡 **DIRECT LOCAL COMMUNITY EMPOWERMENT (Zero Corporate Commission)**")
        for h in hosts[:2]:
            response_parts.append(f"- **{h['business_name']}** ({h['location']})")
            response_parts.append(f"  • Host: {h['host_name']} | Rate: **LKR {h['rate_lkr']:,}/night** (~${h['rate_usd_approx']})")
            response_parts.append(f"  • Highlights: {', '.join(h['offerings'][:2])}")
            response_parts.append(f"  • 📲 *Pre-translated WhatsApp Dispatch ready in Sinhala/Tamil directly to host's phone.*")

    state["final_response"] = "\n".join(response_parts)
    add_log(state, "Synthesizer", "Completed", "Successfully finalized autonomous dispatch payload.")
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
