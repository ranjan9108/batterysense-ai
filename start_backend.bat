@echo off
echo ========================================================
echo Starting FastAPI Backend Server (EV Battery Optimizer)
echo ========================================================
cd /d "%~dp0backend"
if exist ".venv\Scripts\python.exe" (
    echo Using backend virtual environment...
    ".venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000
) else (
    echo Using global python...
    python -m uvicorn main:app --host 127.0.0.1 --port 8000
)
pause
