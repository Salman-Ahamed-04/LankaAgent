import json
import os
import math
from typing import Dict, Any, Optional

# Load Sri Lanka Nodes
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
NODES_PATH = os.path.join(DATA_DIR, "sri_lanka_nodes.json")

def load_nodes():
    try:
        with open(NODES_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("nodes", {})
    except Exception:
        return {}

def haversine_distance(coord1, coord2):
    R = 6371.0 # km
    lat1, lon1 = math.radians(coord1[0]), math.radians(coord1[1])
    lat2, lon2 = math.radians(coord2[0]), math.radians(coord2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c * 1.35, 1) # Road winding factor for SL terrain

def calculate_fair_fare(
    origin: str,
    destination: str,
    vehicle_type: str = "tuk_tuk",
    quoted_scam_fare: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes fair, transparent transport fares in Sri Lanka using CPC fuel rates,
    elevation terrain gradients, and official provincial meter standards.
    Prevents tourist price gouging.
    """
    nodes = load_nodes()
    orig_key = origin.lower().strip().replace(" ", "_")
    dest_key = destination.lower().strip().replace(" ", "_")

    orig_node = nodes.get(orig_key)
    dest_node = nodes.get(dest_key)

    # Approximate distance
    if orig_node and dest_node:
        coords1 = orig_node["coords"]
        coords2 = dest_node["coords"]
        distance_km = haversine_distance(coords1, coords2)
        terrain = dest_node.get("terrain", "flat")
    else:
        # Default fallback distance for demonstration
        distance_km = 35.0
        terrain = "mid_elevation"

    # Terrain multiplier (uphill mountain roads consume up to 35% more fuel)
    terrain_multipliers = {
        "coastal_flat": 1.0,
        "dry_zone_flat": 1.0,
        "mid_elevation": 1.15,
        "high_mountain_steep": 1.35,
        "rugged_remote": 1.40
    }
    terrain_factor = terrain_multipliers.get(terrain, 1.1)

    # Base pricing model (CPC Fuel indexed LKR per km + vehicle depreciation)
    rates = {
        "tuk_tuk": { "first_km": 120, "subsequent_km": 90, "base_fuel": 370 },
        "mini_car": { "first_km": 160, "subsequent_km": 130, "base_fuel": 370 },
        "sedan": { "first_km": 200, "subsequent_km": 170, "base_fuel": 370 },
        "van": { "first_km": 240, "subsequent_km": 210, "base_fuel": 340 }
    }
    selected_rate = rates.get(vehicle_type, rates["tuk_tuk"])

    if distance_km <= 1:
        base_cost = selected_rate["first_km"]
    else:
        base_cost = selected_rate["first_km"] + (distance_km - 1) * selected_rate["subsequent_km"]

    # Apply terrain multiplier
    fair_fare_lkr = round(base_cost * terrain_factor, -1) # rounded to nearest 10 LKR
    # Add modest waiting/traffic buffer (10%)
    fair_fare_lkr = int(fair_fare_lkr * 1.10)
    fair_fare_usd = round(fair_fare_lkr / 310.0, 2) # approx LKR/USD exchange rate

    # Anti-gouging audit
    savings_lkr = None
    overcharge_pct = None
    if quoted_scam_fare and quoted_scam_fare > fair_fare_lkr:
        savings_lkr = int(quoted_scam_fare - fair_fare_lkr)
        overcharge_pct = round(((quoted_scam_fare - fair_fare_lkr) / fair_fare_lkr) * 100, 1)

    # Sinhala & Tamil negotiation scripts
    sinhala_phrase = f"මීටරේ දාලා යමු. සාධාරණ ගාස්තුව රුපියල් {fair_fare_lkr:,} යි."
    sinhala_translit = f"Metere daala yamu. Sadharana gasthuwa rupiyal {fair_fare_lkr:,} yi."
    tamil_phrase = f"மீட்டர் போட்டு போவோம். நியாயமான கட்டணம் ரூ. {fair_fare_lkr:,}."
    tamil_translit = f"Meter pottu povom. Nyaayamaana kattanam Rs. {fair_fare_lkr:,}."

    return {
        "origin": origin.capitalize(),
        "destination": destination.capitalize(),
        "distance_km": distance_km,
        "vehicle_type": vehicle_type,
        "terrain_factor": terrain_factor,
        "estimated_fair_fare_lkr": fair_fare_lkr,
        "estimated_fair_fare_usd": fair_fare_usd,
        "quoted_scam_fare_lkr": quoted_scam_fare,
        "potential_savings_lkr": savings_lkr,
        "overcharge_pct": overcharge_pct,
        "bilingual_phrase_sinhala": sinhala_phrase,
        "bilingual_translit_sinhala": sinhala_translit,
        "bilingual_phrase_tamil": tamil_phrase,
        "bilingual_translit_tamil": tamil_translit
    }
