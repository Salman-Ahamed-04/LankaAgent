# 🌴 LankaAgent: Autonomous Tourism Logistics & Micro-Economy Broker

> **An Agentic AI Multi-Agent System Engineered for Sri Lankan Tourism Resilience, Price Fairness, and Rural Economic Inclusion.**

---

## 🎯 The Real-World Problem in Sri Lanka
Tourism is Sri Lanka's fastest driver of foreign currency (Forex) recovery. However, the travel ecosystem faces two severe structural bottlenecks:
1. **Unpredictable Transit Disruptions:** Unexpected Upcountry rail slips (e.g., Nanu Oya to Ella Main Line) or sudden monsoon sea swells leave independent travelers stranded with no autonomous re-routing support.
2. **Asymmetric Pricing & Economic Concentration:** Tourists outside Colombo are routinely overcharged (up to 300%–500% over gazetted rates) due to lack of transparent meter standards, while authentic rural homestays and village guides (who speak Sinhala or Tamil and lack English digital marketing) are bypassed by large commercial tour cartels.

---

## 🧠 Agentic Architecture (LangGraph Multi-Agent System)

```
                            ┌─────────────────────────────────┐
                            │    Traveler (Web / WhatsApp)    │
                            └────────────────┬────────────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               Supervisor Agent Node                                    │
│                 (Corridor Detection, Intent Binding, Constraint Setup)                 │
└───────────────┬────────────────────────────┬─────────────────────────────┬─────────────┘
                │                            │                             │
                ▼                            ▼                             ▼
  ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
  │ 1. Disruption Sentinel    │ │ 2. Fair-Fare Sentinel     │ │ 3. Local Host Bridge      │
  │ • Scans Rail & Swell feeds│ │ • CPC Fuel index formula  │ │ • Direct rural dispatch   │
  │ • Detects track blockages │ │ • Terrain gradient factor │ │ • Trilingual Sinhala/Tamil│
  │ • Autonomous contingency  │ │ • Anti-gouging card & TTS │ │ • Zero corporate cuts     │
  └───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
                │                            │                             │
                └────────────────────────────┼─────────────────────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │     Synthesizer Node      │
                               │  (Actionable Brief, HITL) │
                               └───────────────────────────┘
```

---

## 🚀 Key Features

* **Deterministic Tool Calling:** Computes mathematical, terrain-indexed transport fares based on official Ceylon Petroleum Corporation (CPC) fuel prices rather than allowing the LLM to hallucinate prices.
* **Autonomous Disruption Recovery:** Detects hazards on mountain rail corridors and maritime zones, formulating realistic, timed alternative connections (e.g., Nanu Oya to Ella via Haputale Pass minivan cooperative).
* **Bilingual Negotiation Engine:** Generates Sinhala and Tamil negotiation audio and transliteration scripts so tourists can insist on fair meter rates with drivers.
* **Rural Micro-Economy Empowerment:** Pre-translates booking inquiries directly into Sinhala and Tamil WhatsApp dispatch payloads for non-English-speaking homestays in places like Belihuloya and Meemure.
* **Full Observability & Thought Trace:** Exposes every agent decision, tool execution time, and status in real-time on an interactive glassmorphic web dashboard.

---

## 🛠️ Tech Stack
* **Agent Core:** Python 3.11+, LangGraph, LangChain Core, Pydantic
* **LLM Engine:** Google Gemini (Gemini 2.5 Flash / Flash-Lite) with deterministic tool execution fallback
* **API Backend:** FastAPI, Uvicorn, ASGI Static Files
* **Frontend:** Modern Vanilla HTML5/CSS3 (Glassmorphism, Dark Mode, Google Fonts Outfit & Plus Jakarta Sans, Web Speech API)

---

## 💻 How to Run

### 1. From Desktop
Open the **`LankaAgent-Project`** folder on your Desktop and double-click:
```bash
run.bat
```

### 2. Manual Command Line
```powershell
# From the project root:
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Then visit: **`http://127.0.0.1:8000`** in your browser.

---

## 📄 How to Put This on Your CV / Resume

### **Project Title:**
**LankaAgent: Autonomous Multi-Agent Tourism Logistics & Micro-Economy Broker**

### **Bullet Points for Resume:**
* *Designed and implemented a stateful multi-agent system using **LangGraph** and **FastAPI** to address real-world travel logistics disruptions and tourist price exploitation in Sri Lanka.*
* *Engineered a deterministic **Fair-Fare Sentinel tool** calculating transport pricing based on live CPC fuel indexes, vehicle depreciation, and terrain gradient multipliers, reducing tourist overcharge rates.*
* *Implemented an **Autonomous Disruption Sentinel** that monitors railway track advisories and marine swell feeds, autonomously generating multi-modal contingency routes with time/cost impact estimates.*
* *Integrated a trilingual (Sinhala/Tamil/English) direct-dispatch bridge empowering rural homestays and community cooperatives to receive verified bookings with zero platform commissions.*
* *Built a real-time reactive web dashboard showcasing live agent thought traces, tool execution graphs, and audio speech synthesis.*
