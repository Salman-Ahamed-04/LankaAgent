import sys
import os
import json

sys.stdout.reconfigure(encoding='utf-8')
from dotenv import load_dotenv
load_dotenv()

from google import genai
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

test_queries = [
    "Can you recommend top 3 places to visit in Kandy and where to eat authentic rice and curry?",
    "A tuk-tuk driver in Colombo asked for 4,500 LKR to go to Mount Lavinia. Is that a scam?",
    "Are there any train delays or landslide issues between Colombo and Kandy right now?",
    "I want to stay in a village homestay in Belihuloya with natural river baths.",
    "Hello! What is LankaAgent and how can you help me during my holiday in Sri Lanka?"
]

prompt_template = """You are the Supervisor Agent of LankaAgent, an autonomous AI travel assistant for Sri Lanka.
Analyze the user's inquiry: "{query}"

Respond ONLY with a valid JSON object (no markdown, no extra text):
{{
  "intent": "route_transit" or "fare_inquiry" or "disruption_check" or "homestay_search" or "general_tourism",
  "origin": "<Sri Lankan city or null>",
  "destination": "<Sri Lankan city or null>",
  "vehicle_type": "tuk_tuk" or "sedan" or "van" or null,
  "quoted_fare_lkr": <number or null>,
  "needs_fare_check": true or false,
  "needs_disruption_check": true or false,
  "needs_host_search": true or false,
  "brief_intent_summary": "<Short description of what traveler is asking>"
}}
"""

for q in test_queries:
    print(f"\n--- QUERY: {q} ---")
    p = prompt_template.format(query=q)
    for model_name in ["gemini-3.5-flash-lite", "gemini-3.5-flash"]:
        try:
            resp = client.models.generate_content(model=model_name, contents=p)
            print(f"[{model_name}] SUCCESS:\n{resp.text.strip()}")
            break
        except Exception as e:
            print(f"[{model_name}] Failed: {e}")
