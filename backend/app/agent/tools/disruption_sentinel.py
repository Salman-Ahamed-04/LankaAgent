import json
import os
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DISRUPTIONS_PATH = os.path.join(DATA_DIR, "live_disruptions.json")
NODES_PATH = os.path.join(DATA_DIR, "sri_lanka_nodes.json")

def load_disruptions():
    try:
        with open(DISRUPTIONS_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("active_disruptions", [])
    except Exception:
        return []

def check_route_disruptions(origin: str, destination: str) -> Dict[str, Any]:
    """
    Scans live Sri Lankan railway, road, and meteorological advisories.
    If a disruption is detected, generates an autonomous fallback route and contingency plan.
    """
    disruptions = load_disruptions()
    orig = origin.lower()
    dest = destination.lower()
    
    matched_alerts = []
    reroute_proposal = None

    for d in disruptions:
        loc = d["location"].lower()
        # Check if incident is in the corridor
        if (orig in loc) or (dest in loc) or ("nanu oya" in loc and ("ella" in dest or "nuwara eliya" in orig or "kandy" in orig)):
            matched_alerts.append(d)

    if matched_alerts:
        primary = matched_alerts[0]
        if primary["category"] == "railway":
            reroute_proposal = {
                "disrupted_leg": f"{origin.capitalize()} to {destination.capitalize()} (Rail Main Line)",
                "recommended_action": "Bypass blocked mountain track segment via vetted highway transfer",
                "alternate_legs": [
                    { "mode": "Scenic Train", "from": origin.capitalize(), "to": "Nanu Oya / Hatton", "duration": "2.5 hrs" },
                    { "mode": "Vetted Co-op Minivan / Tuk-Tuk", "from": "Nanu Oya", "to": destination.capitalize(), "via": "Haputale Pass", "duration": "1.8 hrs" }
                ],
                "time_impact_min": +25,
                "cost_impact_lkr": 2500,
                "safety_status": "Vetted & Safe (Passara/Haputale road clear)",
                "requires_human_confirmation": True
            }
        elif primary["category"] == "weather_marine":
            reroute_proposal = {
                "disrupted_leg": f"{destination.capitalize()} Ocean Tour",
                "recommended_action": "Postpone marine activity to afternoon slot; substitute morning with inland cultural trek",
                "alternate_legs": [
                    { "mode": "Walking / Tuk-Tuk", "activity": "Coconut Tree Hill & Weligama Cinnamon Village", "duration": "3.0 hrs" },
                    { "mode": "Authorized Catamaran", "activity": "Whale Watching (Afternoon window pending harbor master clearance)", "duration": "3.5 hrs" }
                ],
                "time_impact_min": 0,
                "cost_impact_lkr": 0,
                "safety_status": "Harbor clearance pending",
                "requires_human_confirmation": True
            }

    return {
        "has_disruption": len(matched_alerts) > 0,
        "matched_alerts": matched_alerts,
        "reroute_proposal": reroute_proposal
    }
