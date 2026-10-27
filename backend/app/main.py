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
# Google Gemini API Configuration Endpoints
# ==========================================
class GeminiKeyRequest(BaseModel):
    api_key: str

@app.get("/api/config/gemini")
def get_gemini_status():
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if key and len(key.strip()) > 6:
        masked = key[:6] + "..." + key[-4:]
        return { "connected": True, "masked_key": masked, "model": "gemini-3.5-flash" }
    return { "connected": False, "masked_key": None, "model": "gemini-3.5-flash" }

@app.post("/api/config/gemini")
def set_gemini_key(req: GeminiKeyRequest):
    new_key = req.api_key.strip()
    if not new_key:
        raise HTTPException(status_code=400, detail="API Key cannot be empty.")
    
    os.environ["GEMINI_API_KEY"] = new_key
    
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.write(f"GEMINI_API_KEY={new_key}\n")
    except Exception as e:
        print("Could not write to .env:", e)

    return { "status": "success", "connected": True, "masked_key": new_key[:6] + "..." + new_key[-4:] }

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
