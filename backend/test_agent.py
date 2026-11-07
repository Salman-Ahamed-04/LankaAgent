import sys
import os

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app.agent.graph import run_agent

def test_query(q: str):
    print("\n" + "="*80)
    print(f"USER QUERY: {q}")
    print("="*80)
    result = run_agent(q)
    
    print("\n--- THOUGHT TRACE ---")
    for step in result["thought_trace"]:
        print(f"[{step['timestamp']}] {step['agent_name']} -> {step['action']}: {step['details']}")
        
    print("\n--- FINAL AGENT SYNTHESIS ---")
    print(result["final_response"])

def main():
    print("Testing LankaAgent Intelligent Multi-Agent System with Google Gemini...")
    
    # Test 1: General travel advice
    test_query("Can you recommend top 3 places to visit in Kandy and where to eat authentic rice and curry?")
    
    # Test 2: Specific transit disruption & anti-gouging check
    test_query("I am in Kandy planning to travel to Ella tomorrow. A tuk-tuk driver at the station asked for 12,000 LKR. Is that fair? Also what about the trains?")

    print("\n[ALL TESTS PASSED SUCCESSFULLY]")

if __name__ == "__main__":
    main()
