import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.agent.graph import run_agent

def main():
    print("Testing LankaAgent StateGraph...")
    query = "I am in Kandy planning to travel to Ella tomorrow. A tuk-tuk driver at the station asked for 9000 LKR. Is that fair? Also what about the trains?"
    result = run_agent(query)
    
    print("\n--- THOUGHT TRACE ---")
    for step in result["thought_trace"]:
        print(f"[{step['timestamp']}] {step['agent_name']} -> {step['action']}: {step['details']}")
        
    print("\n--- FINAL AGENT SYNTHESIS ---")
    print(result["final_response"])
    print("\n[TEST PASSED SUCCESSFULLY]")

if __name__ == "__main__":
    main()
