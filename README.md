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

### Option 1: Using NPM (Recommended)
You can run the full backend and frontend with standard npm scripts:
```bash
# Start development server with hot-reload:
npm run dev

# Or start standard server:
npm start

# Run the LangGraph agent pipeline test:
npm test
```

### Option 2: From Desktop
Open the **`LankaAgent-Project`** folder on your Desktop and double-click:
```bash
run.bat
```

### Option 3: Manual Python Command Line
```powershell
.\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
Then visit: **`http://127.0.0.1:8000`** in your browser.

---

## 📲 How to Connect to Real WhatsApp (Live Demo)

LankaAgent includes a pre-built webhook endpoint: `/api/whatsapp/webhook` compatible with **Twilio WhatsApp Sandbox** and **Meta WhatsApp Cloud API**.

### 3-Step Setup with Free Twilio Sandbox:
1. **Expose your local server to the internet using ngrok:**
   ```bash
   ngrok http 8000
   ```
   *(Copy your public https URL, e.g., `https://xxxx-xx.ngrok-free.app`)*

2. **Configure Twilio WhatsApp Sandbox:**
   - Log into your free [Twilio Console](https://console.twilio.com/) ➔ Messaging ➔ Try it out ➔ Send a WhatsApp Message.
   - Under **Sandbox Settings**, set **"When a message comes in"** to:
     `https://xxxx-xx.ngrok-free.app/api/whatsapp/webhook` (HTTP POST).

3. **Message LankaAgent from your Phone:**
   - Send the sandbox join code from your personal WhatsApp.
   - Message any travel query (e.g. *"I am in Kandy going to Ella, is 9000 LKR fair for a tuk-tuk?"*).
   - LankaAgent's LangGraph system will process the inquiry and message you back directly with fair fare calculations, disruption alerts, and community host contacts!

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
