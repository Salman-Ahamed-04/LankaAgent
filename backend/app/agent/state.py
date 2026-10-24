from typing import TypedDict, List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentLogStep(TypedDict):
    step_id: str
    agent_name: str
    action: str
    details: str
    timestamp: str

class FairFareCard(TypedDict):
    origin: str
    destination: str
    distance_km: float
    vehicle_type: str
    terrain_factor: float
    base_fuel_rate_lkr: float
    estimated_fair_fare_lkr: float
    estimated_fair_fare_usd: float
    quoted_scam_fare_lkr: Optional[float]
    potential_savings_lkr: Optional[float]
    bilingual_phrase_sinhala: str
    bilingual_phrase_tamil: str

class DisruptionAlert(TypedDict):
    id: str
    category: str
    severity: str
    location: str
    event: str
    status: str
    agent_recommendation: str

class LankaAgentState(TypedDict):
    messages: List[Dict[str, str]]
    user_query: str
    origin: Optional[str]
    destination: Optional[str]
    active_disruptions: List[DisruptionAlert]
    fare_card: Optional[FairFareCard]
    recommended_hosts: List[Dict[str, Any]]
    suggested_reroute: Optional[Dict[str, Any]]
    thought_trace: List[AgentLogStep]
    final_response: str
    requires_human_approval: bool
