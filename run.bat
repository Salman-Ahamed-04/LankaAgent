@echo off
echo =====================================================================
echo  LankaAgent: Autonomous Tourism Logistics & Micro-Economy Broker
echo =====================================================================
echo Starting LankaAgent FastAPI and Web Dashboard...
echo Open your browser at: http://127.0.0.1:8000
echo.

.\venv\Scripts\python -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
pause
