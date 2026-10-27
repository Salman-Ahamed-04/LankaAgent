import os
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Add current backend folder to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.agent.graph import run_agent
from app.agent.tools.fare_calculator import calculate_fair_fare, load_nodes
from app.agent.tools.disruption_sentinel import check_route_disruptions, load_disruptions
from app.agent.tools.local_host_bridge import match_and_dispatch_local_hosts, load_hosts

app = FastAPI(
    title="LankaAgent API",
    description="Autonomous Tourism Logistics & Micro-Economy Broker Multi-Agent System",
    version="1.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    origin: Optional[str] = None
    destination: Optional[str] = None

class FareRequest(BaseModel):
    origin: str
    destination: str
    vehicle_type: str = "tuk_tuk"
    quoted_scam_fare: Optional[float] = None

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    try:
        state = run_agent(req.query, req.origin, req.destination)
        return {
            "status": "success",
            "origin": state.get("origin"),
            "destination": state.get("destination"),
            "final_response": state.get("final_response"),
            "thought_trace": state.get("thought_trace"),
            "fare_card": state.get("fare_card"),
            "active_disruptions": state.get("active_disruptions"),
            "suggested_reroute": state.get("suggested_reroute"),
            "recommended_hosts": state.get("recommended_hosts"),
            "requires_human_approval": state.get("requires_human_approval")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculate-fare")
def fare_endpoint(req: FareRequest):
    return calculate_fair_fare(req.origin, req.destination, req.vehicle_type, req.quoted_scam_fare)

@app.get("/api/disruptions")
def disruptions_endpoint():
    return { "active_disruptions": load_disruptions() }

@app.get("/api/nodes")
def nodes_endpoint():
    return { "nodes": load_nodes() }

@app.get("/api/hosts")
def hosts_endpoint(location: str = "ella"):
    return match_and_dispatch_local_hosts(location)

# ==========================================
# WhatsApp Webhook Integration
# ==========================================
@app.post("/api/whatsapp/webhook")
async def whatsapp_webhook(request: Request):
    """
    Receives incoming WhatsApp messages from Twilio or Meta WhatsApp Cloud API,
    runs the LangGraph multi-agent pipeline, and responds directly back on WhatsApp.
    """
    incoming_text = ""
    sender_phone = ""

    # 1. Try reading form data (Twilio WhatsApp)
    try:
        form_data = await request.form()
        incoming_text = form_data.get("Body", "")
        sender_phone = form_data.get("From", "")
    except Exception:
        pass

    # 2. Try reading JSON payload (Meta WhatsApp Cloud API)
    if not incoming_text:
        try:
            body_json = await request.json()
            entry = body_json.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            messages = value.get("messages", [{}])
            if messages:
                incoming_text = messages[0].get("text", {}).get("body", "")
                sender_phone = messages[0].get("from", "")
        except Exception:
            pass

    if not incoming_text:
        incoming_text = "Hello! What can you help me with in Sri Lanka?"

    # Execute LangGraph Multi-Agent System
    state = run_agent(incoming_text)
    raw_response = state.get("final_response", "")

    # Format cleanly for WhatsApp markdown
    wa_response = (
        raw_response
        .replace("### ", "🌴 ")
        .replace("## ", "")
        .replace("**", "*") # WhatsApp uses single asterisks for bold
    )

    # Return Twilio TwiML XML
    twiml_reply = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{wa_response}</Message>
</Response>"""
    return Response(content=twiml_reply, media_type="application/xml")

@app.get("/api/whatsapp/webhook")
def verify_whatsapp_meta_webhook(request: Request):
    """Handles verification challenge for Meta WhatsApp Cloud API webhook."""
    challenge = request.query_params.get("hub.challenge")
    if challenge:
        return Response(content=challenge, media_type="text/plain")
    return {"status": "LankaAgent WhatsApp Webhook Ready", "service": "Twilio & Meta Cloud API"}

# Mount frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    from fastapi.responses import FileResponse
    fav_path = os.path.join(FRONTEND_DIR, "favicon.svg")
    if os.path.exists(fav_path):
        return FileResponse(fav_path, media_type="image/svg+xml")
    return {"status": "ok"}

if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
