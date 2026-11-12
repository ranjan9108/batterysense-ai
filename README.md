# AI-Based EV Battery Life Prediction and Smart Charging Optimizer

A full-stack, production-grade engineering web application and machine learning pipeline for Electric Vehicle (EV) battery health assessment and intelligent charging optimization.

---

## 🚀 Key Highlights & Architectural Features

- **Machine Learning Engine**: Powered strictly by **CatBoost Regressors** (`iterations=250, depth=4, learning_rate=0.04, loss_function='RMSE'`) trained directly on operational battery test cycles from `Battery_dataset.xlsx`.
- **Target Health Predictions**:
  - **State of Charge (SOC)**: Estimates current charge level (%) from voltage profiles.
  - **State of Health (SOH)**: Estimates capacity retention (%) relative to nominal capacity.
  - **Remaining Useful Life (RUL)**: Predicts remaining equivalent cycles before reaching the 80% End-of-Life (EOL) threshold.
- **Smart Charging Optimizer**:
  - Calculates net energy required (kWh) and total grid energy drawn.
  - Estimates charging session duration with two-phase CC/CV progression.
  - Computes electricity costs in Indian Rupees (₹ INR) based on configurable tariff rates.
  - Evaluates time-window feasibility and calculates required minimum charger power (kW) if time-constrained.
- **Battery Analytics & Voltage Profiling**:
  - High-resolution sequential voltage curves across sample steps (Voltage_1 to Voltage_40).
  - Chemistry distributions (LFP, NiCd, NMC, NiMH).
  - Summary voltage statistics (Mean, Min, Max, Range, Std Dev).
- **Dataset Explorer & Transparency**:
  - Live preview of primary experimental records from `Battery_dataset.xlsx`.
  - Complete column and feature definitions data dictionary.
  - **Dataset Label Disclosure**: Explicit transparency disclosing that SOH and RUL targets are assumption-based proxy estimates rather than destructive physical cell teardown.
- **No Model Comparison Graphs**: Strictly adheres to the requirement of focusing entirely on the CatBoost ML pipeline without comparative distraction.

---

## 📊 CatBoost Regressor Evaluation Metrics (Held-Out Test Set)

Models were evaluated on a held-out test split (20%) using **Mean Absolute Error (MAE)**, **Root Mean Squared Error (RMSE)**, and the **Coefficient of Determination (R²)**:

| Target Parameter | Target Column in Dataset | Unit | Test MAE | Test RMSE | Test R² | Model Type |
|---|---|---|---|---|---|---|
| **State of Charge (SOC)** | `SOC_Mean_pct` | % | **0.4826** | **0.5506** | **0.9996** | `CatBoostRegressor` |
| **State of Health (SOH)** | `SOH_Estimated_pct` | % | **0.1068** | **0.1355** | **0.9967** | `CatBoostRegressor` |
| **Remaining Useful Life (RUL)** | `RUL_Estimated_Cycles` | cycles | **2.1948** | **2.8242** | **0.9964** | `CatBoostRegressor` |

*All fitted models and metadata are saved in `backend/models/*.joblib` and `backend/models/metadata.json`.*

---

## 📁 Repository Structure

```
major project website/
├── backend/
│   ├── data/
│   │   └── Battery_dataset.xlsx    <-- Primary experimental dataset
│   ├── models/
│   │   ├── soc_model.joblib        <-- Fitted CatBoost SOC model
│   │   ├── soh_model.joblib        <-- Fitted CatBoost SOH model
│   │   ├── rul_model.joblib        <-- Fitted CatBoost RUL model
│   │   ├── metadata.json           <-- Features schema & model metadata
│   │   └── evaluation_metrics.json <-- Verified MAE, RMSE, and R2 scores
│   ├── main.py                     <-- FastAPI application & REST endpoints
│   ├── train.py                    <-- CatBoost training & evaluation script
│   ├── test_direct.py              <-- Backend integration test suite
│   └── requirements.txt            <-- Clean Python dependency list
├── frontend/
│   ├── src/
│   │   ├── components/             <-- Header, Sidebar, KpiCard
│   │   ├── pages/
│   │   │   ├── Overview.jsx        <-- Dashboard overview & live visualizer
│   │   │   ├── BatteryPrediction.jsx<-- Input form & CatBoost outputs
│   │   │   ├── SmartCharging.jsx   <-- Energy, duration, cost (INR) calculator
│   │   │   ├── BatteryAnalytics.jsx<-- Voltage profile charts & stats
│   │   │   └── DatasetView.jsx     <-- Dataset records & data dictionary
│   │   ├── services/
│   │   │   └── api.js              <-- FastAPI integration service
│   │   ├── App.jsx                 <-- Main container & layout
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── README.md
├── start_backend.bat
├── start_frontend.bat
└── train_catboost.bat
```

---

## 🛠️ Step-by-Step Execution Guide

### 1. Prerequisites
- **Python**: Version 3.10 to 3.14 recommended.
- **Node.js**: Version 18+ and npm installed.
- **Dataset**: `Battery_dataset.xlsx` must reside in `backend/data/Battery_dataset.xlsx` (already present and verified).

---

### 2. Backend Setup & CatBoost Model Training

#### In Windows PowerShell or Command Prompt:

```powershell
# Navigate to the backend directory
cd backend

# Create and activate a Python virtual environment (if not already done)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r requirements.txt

# Run CatBoost training script
python train.py
```

*This will load `backend/data/Battery_dataset.xlsx`, train the CatBoost models, print MAE, RMSE, and R² scores, and save `soc_model.joblib`, `soh_model.joblib`, and `rul_model.joblib`.*

---

### 3. Start the FastAPI Backend Server

```powershell
# From the backend directory with .venv activated:
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

*The API is now live at `http://127.0.0.1:8000`. You can view the interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.*

---

### 4. Start the React Frontend

#### In a separate terminal:

```powershell
# Navigate to the frontend directory
cd frontend

# Install npm dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```

*Open your web browser and navigate to `http://localhost:5173/`.*

---

### 5. Build for Production Deployment

```powershell
# Inside frontend directory:
npm run build
```

*Production assets are bundled into `frontend/dist/` ready to be served by any static host or embedded into FastAPI.*

---

## ⚡ Deployment Options

### Option A: Local Full-Stack Launch
Use the included convenience scripts in the root directory:
1. Double-click `start_backend.bat`
2. Double-click `start_frontend.bat`

### Option B: Cloud Hosting (Render / Railway / AWS / DigitalOcean)
- **Backend Service**:
  - Runtime: Python 3.11+
  - Build Command: `pip install -r backend/requirements.txt && python backend/train.py`
  - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Frontend Service (Vercel / Netlify / Render Static)**:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variable: `VITE_API_URL=https://<your-backend-domain>`

---

## 📜 Dataset Disclosure Notice
In compliance with engineering research integrity:
- **Temperature Input**: Temperature sensor values were not logged in the original experimental cycle runs and are intentionally excluded to prevent synthetic distortion.
- **SOH and RUL Targets**: In the provided dataset (`Battery_dataset.xlsx`), the SOH and RUL values are derived from proxy mathematical formulas (`SOH_RUL_Method`). They are assumption-based proxies rather than destructive physical teardown measurements. CatBoost regresses these target distributions accurately with high precision ($R^2 > 0.99$).
