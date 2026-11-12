@echo off
echo ========================================================
echo Training CatBoost Models on Battery_dataset.xlsx
echo ========================================================
cd /d "%~dp0backend"
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" train.py
) else (
    python train.py
)
pause
