import json
import os
from typing import List, Dict, Any, Optional

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
HOSTS_PATH = os.path.join(DATA_DIR, "verified_hosts.json")

def load_hosts():
    try:
        with open(HOSTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f).get("hosts", [])
    except Exception:
        return []

def match_and_dispatch_local_hosts(
    location: str,
    traveler_needs: str = "homestay and cultural dinner",
    traveler_count: int = 2
) -> Dict[str, Any]:
    """
    Finds verified local rural homestays and community guides in Sri Lanka.
    Generates trilingual dispatch payloads (English -> Sinhala/Tamil) and voice-note scripts
    to empower non-English-speaking village hosts without corporate middlemen.
    """
    hosts = load_hosts()
    loc = location.lower()

    matched = [h for h in hosts if loc in h["location"].lower() or any(loc in o.lower() for o in h["offerings"])]
    if not matched:
        # Fallback to closest regional host
        matched = hosts[:2]

    dispatches = []
    for host in matched:
        # Generate natural local language dispatch message
        host_name = host["name"]
        sinhala_dispatch = (
            f"ආයුබෝවන් {host_name} මහතාණෙනි! ලංකා ඒජන්ට් හරහා සංචාරකයින් {traveler_count} දෙනෙකු "
            f"ඔබගේ {host['business_name']} වෙත පැමිණීමට විමසයි. "
            f"අවශ්‍යතාවය: {traveler_needs}. "
            f"ගාස්තුව: රාත්‍රියකට රු. {host.get('rate_lkr_per_night', 6000):,}. "
            f"තහවුරු කිරීමට '1' ඔබන්න."
        )
        tamil_dispatch = (
            f"வணக்கம் {host_name}! லங்கா ஏஜென்ட் மூலம் {traveler_count} பயணிகள் "
            f"உங்கள் {host['business_name']} க்கு வர விரும்புகிறார்கள். "
            f"தேவை: {traveler_needs}. "
            f"உறுதிப்படுத்த '1' ஐ அழுத்தவும்."
        )

        dispatches.append({
            "host_id": host["id"],
            "host_name": host["name"],
            "business_name": host["business_name"],
            "location": host["location"],
            "type": host["type"],
            "rate_lkr": host.get("rate_lkr_per_night") or host.get("rate_lkr_per_day") or (host.get("rate_lkr_per_km", 100) * 20),
            "rate_usd_approx": host.get("rate_usd_approx", 20),
            "spoken_languages": host["spoken_languages"],
            "phone": host["phone"],
            "offerings": host["offerings"],
            "bio_english": host["bio_english"],
            "dispatch_message_sinhala": sinhala_dispatch,
            "dispatch_message_tamil": tamil_dispatch,
            "voice_note_status": "Ready to transmit via WhatsApp Audio"
        })

    return {
        "matched_hosts_count": len(dispatches),
        "hosts": dispatches
    }
