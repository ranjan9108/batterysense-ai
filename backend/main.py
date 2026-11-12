import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Initialize FastAPI application
app = FastAPI(
    title="BatterySense AI API",
    description="Backend API for EV battery health prediction (SOC, SOH, RUL) and smart charging optimization.",
    version="1.0.0"
)

# Configure CORS for local development and production deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")
DATASET_PATH = os.path.join(DATA_DIR, "Battery_dataset.xlsx")

# Global state for loaded models and metadata
loaded_models: Dict[str, Any] = {}
models_metadata: Dict[str, Any] = {}
evaluation_metrics: Dict[str, Any] = {}
cached_dataset_summary: Optional[Dict[str, Any]] = None

def load_system_artifacts():
    global loaded_models, models_metadata, evaluation_metrics
    metadata_path = os.path.join(MODELS_DIR, "metadata.json")
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r") as f:
                models_metadata = json.load(f)
        except Exception as e:
            print(f"Warning: Could not read metadata.json: {e}")
            
    eval_path = os.path.join(MODELS_DIR, "evaluation_metrics.json")
    if os.path.exists(eval_path):
        try:
            with open(eval_path, "r") as f:
                evaluation_metrics = json.load(f)
        except Exception as e:
            print(f"Warning: Could not read evaluation_metrics.json: {e}")

    for target in ["soc", "soh", "rul"]:
        model_file = os.path.join(MODELS_DIR, f"{target}_model.joblib")
        if os.path.exists(model_file):
            try:
                loaded_models[target] = joblib.load(model_file)
                print(f"Successfully loaded {target.upper()} model.")
            except Exception as e:
                print(f"Error loading {model_file}: {e}")
        else:
            print(f"Model file for {target.upper()} not found at {model_file}")

# Load models at startup
load_system_artifacts()

# Supported Battery Chemistry Baselines (from training dataset)
CHEMISTRY_PROFILES = {
    1: {
        "name": "Lithium Iron Phosphate (LFP)",
        "CC": 1.5,
        "C_rate": 1.25,
        "Voltage_Min_V": 2.50,
        "Voltage_Max_V": 3.65,
        "Voltage_Mean_V": 3.28
    },
    2: {
        "name": "Nickel-Cadmium (NiCd)",
        "CC": 1.0,
        "C_rate": 1.0,
        "Voltage_Min_V": 1.00,
        "Voltage_Max_V": 1.45,
        "Voltage_Mean_V": 1.30
    },
    3: {
        "name": "Nickel Manganese Cobalt (NMC)",
        "CC": 2.5,
        "C_rate": 1.38,
        "Voltage_Min_V": 2.80,
        "Voltage_Max_V": 4.20,
        "Voltage_Mean_V": 3.74
    }
}

# Pydantic Request Models
class BatteryFeaturesInput(BaseModel):
    Type_of_battry: int = Field(1, description="Battery Chemistry: 1=LFP, 2=NiCd, 3=NMC", ge=1, le=3)
    Current_Cycle_Number_Input: float = Field(25.0, description="Current cycle count", ge=0.0)
    CH_1_Dis_0: int = Field(1, description="1 for Charge, 0 for Discharge", ge=0, le=1)
    CC: Optional[float] = Field(None, description="Constant Current in Amperes", ge=0.0)
    C_rate: Optional[float] = Field(None, description="C-rate of charge or discharge", gt=0.0)
    Voltage_Min_V: Optional[float] = Field(None, description="Minimum voltage in Volts", gt=0.0)
    Voltage_Max_V: Optional[float] = Field(None, description="Maximum voltage in Volts", gt=0.0)
    Voltage_Mean_V: Optional[float] = Field(None, description="Mean voltage in Volts", gt=0.0)
    Voltage_Std_V: Optional[float] = Field(None, description="Standard deviation of voltage", ge=0.0)
    Voltage_Range_V: Optional[float] = Field(None, description="Voltage Range (Max - Min)", ge=0.0)
    Voltage_Median_V: Optional[float] = Field(None, description="Median voltage in Volts", gt=0.0)
    Voltage_Start_V: Optional[float] = Field(None, description="Starting voltage in Volts", gt=0.0)
    Voltage_End_V: Optional[float] = Field(None, description="Ending voltage in Volts", gt=0.0)
    Voltage_Coefficient_of_Variation: Optional[float] = Field(None, description="Voltage Std / Mean", ge=0.0)

    class Config:
        json_schema_extra = {
            "example": {
                "Type_of_battry": 1,
                "Current_Cycle_Number_Input": 25.0,
                "CH_1_Dis_0": 1,
                "CC": 1.5,
                "C_rate": 1.25,
                "Voltage_Min_V": 2.50,
                "Voltage_Max_V": 3.65,
                "Voltage_Mean_V": 3.28
            }
        }

class ChargingOptimizerInput(BaseModel):
    current_charge_pct: float = Field(..., description="Current battery charge percentage", ge=0.0, le=100.0)
    desired_charge_pct: float = Field(..., description="Desired target charge percentage", ge=0.0, le=100.0)
    battery_capacity_kwh: float = Field(..., description="Total battery capacity in kWh", gt=0.0)
    charger_power_kw: float = Field(..., description="Charger rating in kW", gt=0.0)
    tariff_inr_per_kwh: float = Field(8.5, description="Electricity cost in INR per kWh", ge=0.0)
    charging_efficiency_pct: float = Field(90.0, description="Overall charging efficiency percentage (0-100)", gt=0.0, le=100.0)
    available_time_hours: float = Field(8.0, description="Available charging time window in hours", ge=0.0)

    class Config:
        json_schema_extra = {
            "example": {
                "current_charge_pct": 20.0,
                "desired_charge_pct": 80.0,
                "battery_capacity_kwh": 50.0,
                "charger_power_kw": 7.4,
                "tariff_inr_per_kwh": 8.5,
                "charging_efficiency_pct": 92.0,
                "available_time_hours": 6.0
            }
        }

def prepare_feature_row(features: BatteryFeaturesInput) -> pd.DataFrame:
    """Prepares an ordered dataframe matching exact training columns."""
    b_type = int(features.Type_of_battry)
    profile = CHEMISTRY_PROFILES.get(b_type, CHEMISTRY_PROFILES[1])

    v_min = features.Voltage_Min_V if features.Voltage_Min_V is not None else profile["Voltage_Min_V"]
    v_max = features.Voltage_Max_V if features.Voltage_Max_V is not None else profile["Voltage_Max_V"]
    v_mean = features.Voltage_Mean_V if features.Voltage_Mean_V is not None else profile["Voltage_Mean_V"]
    cc = features.CC if features.CC is not None else profile["CC"]
    c_rate = features.C_rate if features.C_rate is not None else profile["C_rate"]

    v_std = features.Voltage_Std_V if features.Voltage_Std_V is not None else max(0.01, (v_max - v_min) / 4.0)
    v_range = features.Voltage_Range_V if features.Voltage_Range_V is not None else (v_max - v_min)
    v_med = features.Voltage_Median_V if features.Voltage_Median_V is not None else (v_min + v_max) / 2.0
    v_start = features.Voltage_Start_V if features.Voltage_Start_V is not None else (v_min if features.CH_1_Dis_0 == 1 else v_max)
    v_end = features.Voltage_End_V if features.Voltage_End_V is not None else (v_max if features.CH_1_Dis_0 == 1 else v_min)
    v_cov = features.Voltage_Coefficient_of_Variation if features.Voltage_Coefficient_of_Variation is not None else (v_std / v_mean if v_mean != 0 else 0.0)

    row = {
        "CC": float(cc),
        "CH 1/Dis 0": int(features.CH_1_Dis_0),
        "Type of battry": int(b_type),
        "C-rate": float(c_rate),
        "Current_Cycle_Number_Input": float(features.Current_Cycle_Number_Input),
        "Voltage_Min_V": float(v_min),
        "Voltage_Max_V": float(v_max),
        "Voltage_Mean_V": float(v_mean),
        "Voltage_Std_V": float(v_std),
        "Voltage_Range_V": float(v_range),
        "Voltage_Median_V": float(v_med),
        "Voltage_Start_V": float(v_start),
        "Voltage_End_V": float(v_end),
        "Voltage_Coefficient_of_Variation": float(v_cov)
    }

    # Strict column order matching models_metadata
    expected_order = models_metadata.get("feature_names", list(row.keys()))
    return pd.DataFrame([row])[expected_order]

# ----------------- ENDPOINTS -----------------

@app.get("/", tags=["System"])
def root():
    """Root endpoint welcoming visitors and providing API documentation links."""
    return {
        "service": "BatterySense AI API",
        "status": "online",
        "description": "Intelligent EV Battery Life Prediction (SOC, SOH, RUL) & Smart Charging Optimizer",
        "documentation": "/docs",
        "health": "/health",
        "models_loaded": {
            "soc": "soc" in loaded_models,
            "soh": "soh" in loaded_models,
            "rul": "rul" in loaded_models
        }
    }

@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint confirming backend status and model readiness."""
    return {
        "status": "online",
        "service": "BatterySense AI",
        "models_loaded": {
            "soc": "soc" in loaded_models,
            "soh": "soh" in loaded_models,
            "rul": "rul" in loaded_models
        },
        "dataset_available": os.path.exists(DATASET_PATH)
    }

@app.get("/features", tags=["Metadata"])
def get_features():
    """Returns expected input feature schema, descriptions, and dataset notes."""
    if not models_metadata:
        load_system_artifacts()
    return {
        "ml_framework": "CatBoost",
        "feature_count": models_metadata.get("feature_count", 14),
        "features": models_metadata.get("feature_details", {}),
        "battery_types": {
            1: "Lithium Iron Phosphate (LFP)",
            2: "Nickel-Cadmium (NiCd)",
            3: "Nickel Manganese Cobalt (NMC)"
        },
        "temperature_note": "Battery temperature measurements were not recorded in the primary dataset and are therefore excluded from model input to maintain integrity.",
        "dataset_label_disclosure": models_metadata.get("dataset_label_disclosure", {
            "status": "Filled with proxy-based assumptions; not measured/validated labels",
            "is_ground_truth_measured": False,
            "note": "SOH and RUL targets are assumption-based proxy estimates calculated from voltage behavior and cycling assumptions rather than destructive physical end-of-life teardown."
        }),
        "target_models": models_metadata.get("target_models", {})
    }

@app.post("/predict/soc", tags=["Predictions"])
def predict_soc(features: BatteryFeaturesInput):
    """Predicts Battery State of Charge (SOC) percentage."""
    if "soc" not in loaded_models:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SOC prediction model is not currently loaded or trained."
        )
    df_row = prepare_feature_row(features)
    pred_val = float(loaded_models["soc"].predict(df_row)[0])
    bounded_val = max(0.0, min(100.0, pred_val))

    meta = models_metadata.get("target_models", {}).get("soc", {})
    return {
        "target": "SOC",
        "predicted_value": round(bounded_val, 2),
        "unit": "%",
        "model_used": meta.get("model_type", "Trained ML Model"),
        "status": "Optimal" if bounded_val >= 20.0 else "Low SOC Alert",
        "explanation": f"State of Charge estimated at {bounded_val:.1f}%. Indicates current available electrical energy relative to total charge capacity under operational voltage profile."
    }

@app.post("/predict/soh", tags=["Predictions"])
def predict_soh(features: BatteryFeaturesInput):
    """Predicts Battery State of Health (SOH) percentage."""
    if "soh" not in loaded_models:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SOH prediction model is not currently loaded or trained."
        )
    df_row = prepare_feature_row(features)
    pred_val = float(loaded_models["soh"].predict(df_row)[0])
    bounded_val = max(50.0, min(100.0, pred_val))

    meta = models_metadata.get("target_models", {}).get("soh", {})
    
    if bounded_val >= 90.0:
        health_status = "Excellent"
    elif bounded_val >= 80.0:
        health_status = "Good / Stable"
    else:
        health_status = "Degraded (EOL Threshold Approaching)"

    return {
        "target": "SOH",
        "predicted_value": round(bounded_val, 2),
        "unit": "%",
        "model_used": meta.get("model_type", "Trained ML Model"),
        "status": health_status,
        "explanation": f"State of Health estimated at {bounded_val:.2f}%. Reflects retention of nominal storage capacity after {features.Current_Cycle_Number_Input:.0f} cycles."
    }

@app.post("/predict/rul", tags=["Predictions"])
def predict_rul(features: BatteryFeaturesInput):
    """Predicts Battery Remaining Useful Life (RUL) in cycles."""
    if "rul" not in loaded_models:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RUL prediction model is not currently loaded or trained."
        )
    df_row = prepare_feature_row(features)
    pred_val = float(loaded_models["rul"].predict(df_row)[0])
    bounded_val = max(0.0, pred_val)

    meta = models_metadata.get("target_models", {}).get("rul", {})

    return {
        "target": "RUL",
        "predicted_value": round(bounded_val, 1),
        "unit": "cycles",
        "model_used": meta.get("model_type", "Trained ML Model"),
        "status": "Nominal Lifespan" if bounded_val > 100 else "End-of-Life Caution",
        "explanation": f"Remaining Useful Life estimated at {bounded_val:.0f} full equivalent charge-discharge cycles before capacity drops below operational end-of-life threshold (80%)."
    }

@app.post("/predict/all", tags=["Predictions"])
def predict_all(features: BatteryFeaturesInput):
    """Calculates all available battery predictions (SOC, SOH, RUL) in a single request."""
    df_row = prepare_feature_row(features)
    results = {}

    # SOC
    if "soc" in loaded_models:
        soc_val = max(0.0, min(100.0, float(loaded_models["soc"].predict(df_row)[0])))
        soc_meta = models_metadata.get("target_models", {}).get("soc", {})
        results["soc"] = {
            "target": "State of Charge (SOC)",
            "predicted_value": round(soc_val, 2),
            "unit": "%",
            "model_used": soc_meta.get("model_type", "Trained ML Model"),
            "status": "Optimal" if soc_val >= 20.0 else "Low SOC Alert",
            "explanation": f"Estimated charge level is {soc_val:.1f}% based on operational current and voltage."
        }
    else:
        results["soc"] = None

    # SOH
    if "soh" in loaded_models:
        soh_val = max(50.0, min(100.0, float(loaded_models["soh"].predict(df_row)[0])))
        soh_meta = models_metadata.get("target_models", {}).get("soh", {})
        results["soh"] = {
            "target": "State of Health (SOH)",
            "predicted_value": round(soh_val, 2),
            "unit": "%",
            "model_used": soh_meta.get("model_type", "Trained ML Model"),
            "status": "Excellent" if soh_val >= 90.0 else ("Good" if soh_val >= 80.0 else "Degraded"),
            "explanation": f"Estimated health is {soh_val:.2f}% relative to nominal factory capacity."
        }
    else:
        results["soh"] = None

    # RUL
    if "rul" in loaded_models:
        rul_val = max(0.0, float(loaded_models["rul"].predict(df_row)[0]))
        rul_meta = models_metadata.get("target_models", {}).get("rul", {})
        results["rul"] = {
            "target": "Remaining Useful Life (RUL)",
            "predicted_value": round(rul_val, 1),
            "unit": "cycles",
            "model_used": rul_meta.get("model_type", "Trained ML Model"),
            "status": "Healthy Longevity" if rul_val > 100 else "Service Replacement Recommended",
            "explanation": f"Estimated {rul_val:.0f} cycles remaining before reaching retirement threshold."
        }
    else:
        results["rul"] = None

    # Overall battery condition summary
    overall_health = "Optimal"
    if results.get("soh") and results["soh"]["predicted_value"] < 80.0:
        overall_health = "Degraded"
    elif results.get("rul") and results["rul"]["predicted_value"] < 80:
        overall_health = "Attention Required"
    elif results.get("soc") and results["soc"]["predicted_value"] < 20.0:
        overall_health = "Recharge Required"

    v_min_eff = float(df_row["Voltage_Min_V"].iloc[0])
    v_max_eff = float(df_row["Voltage_Max_V"].iloc[0])
    v_mean_eff = float(df_row["Voltage_Mean_V"].iloc[0])
    c_rate_eff = float(df_row["C-rate"].iloc[0])

    return {
        "status": "success",
        "overall_condition": overall_health,
        "ml_framework": "CatBoost",
        "dataset_label_disclosure": models_metadata.get("dataset_label_disclosure", {}),
        "input_summary": {
            "current_cycle": features.Current_Cycle_Number_Input,
            "c_rate": c_rate_eff,
            "mean_voltage_v": v_mean_eff,
            "voltage_range_v": round((v_max_eff - v_min_eff), 3)
        },
        "predictions": results,
        "timestamp": pd.Timestamp.now().isoformat()
    }

@app.post("/charging/optimize", tags=["Smart Charging"])
def optimize_charging(opt: ChargingOptimizerInput):
    """Calculates charging energy, time, cost, feasibility, and schedule recommendations."""
    if opt.desired_charge_pct <= opt.current_charge_pct:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Desired charge percentage must be greater than current battery charge percentage."
        )

    # 1. Delta Charge and Required Net Energy (kWh stored into battery)
    delta_pct = opt.desired_charge_pct - opt.current_charge_pct
    energy_stored_kwh = opt.battery_capacity_kwh * (delta_pct / 100.0)

    # 2. Total Electrical Energy from Grid (accounting for charging conversion losses)
    efficiency_fraction = opt.charging_efficiency_pct / 100.0
    energy_grid_kwh = energy_stored_kwh / efficiency_fraction

    # 3. Estimated Charging Duration (hours)
    # Effective power delivered into battery = Charger Power * Efficiency
    effective_charging_power_kw = opt.charger_power_kw * efficiency_fraction
    estimated_time_hours = energy_stored_kwh / effective_charging_power_kw

    # 4. Total Cost in INR
    estimated_cost_inr = energy_grid_kwh * opt.tariff_inr_per_kwh

    # 5. Feasibility within Available Time Window
    is_feasible = estimated_time_hours <= opt.available_time_hours
    time_margin_hours = opt.available_time_hours - estimated_time_hours

    # 6. Required Charger Power to meet available time window
    if opt.available_time_hours > 0:
        min_charger_power_kw = energy_stored_kwh / (opt.available_time_hours * efficiency_fraction)
    else:
        min_charger_power_kw = opt.charger_power_kw

    # 7. Formulate Recommended Charging Schedule
    # Split session into Constant Current (CC: bulk to 80%) and Constant Voltage (CV: taper from 80% to 100%)
    schedule_steps = []
    if opt.desired_charge_pct > 80.0 and opt.current_charge_pct < 80.0:
        # Phase 1: Rapid bulk charging up to 80%
        bulk_delta = 80.0 - opt.current_charge_pct
        bulk_energy = opt.battery_capacity_kwh * (bulk_delta / 100.0)
        bulk_time = bulk_energy / effective_charging_power_kw
        schedule_steps.append({
            "phase": "Bulk Constant Current Phase",
            "soc_range": f"{opt.current_charge_pct:.0f}% to 80%",
            "energy_kwh": round(bulk_energy, 2),
            "estimated_hours": round(bulk_time, 2),
            "recommendation": "Full rated charger power utilized with constant current."
        })
        # Phase 2: Tapered absorption charging from 80% to desired
        taper_delta = opt.desired_charge_pct - 80.0
        taper_energy = opt.battery_capacity_kwh * (taper_delta / 100.0)
        # CV phase typically takes ~1.3x longer due to current tapering
        taper_time = (taper_energy / effective_charging_power_kw) * 1.3
        schedule_steps.append({
            "phase": "Tapered Absorption Phase",
            "soc_range": f"80% to {opt.desired_charge_pct:.0f}%",
            "energy_kwh": round(taper_energy, 2),
            "estimated_hours": round(taper_time, 2),
            "recommendation": "Current gradually tapers to preserve cell voltage limits and prevent overheating."
        })
    else:
        schedule_steps.append({
            "phase": "Standard Constant Rate Phase",
            "soc_range": f"{opt.current_charge_pct:.0f}% to {opt.desired_charge_pct:.0f}%",
            "energy_kwh": round(energy_stored_kwh, 2),
            "estimated_hours": round(estimated_time_hours, 2),
            "recommendation": "Maintain steady charging under monitored thermal boundaries."
        })

    hours_int = int(estimated_time_hours)
    minutes_int = int(round((estimated_time_hours - hours_int) * 60))

    return {
        "status": "success",
        "inputs": {
            "current_soc_pct": opt.current_charge_pct,
            "desired_soc_pct": opt.desired_charge_pct,
            "battery_capacity_kwh": opt.battery_capacity_kwh,
            "charger_power_kw": opt.charger_power_kw,
            "tariff_inr_per_kwh": opt.tariff_inr_per_kwh,
            "charging_efficiency_pct": opt.charging_efficiency_pct,
            "available_time_hours": opt.available_time_hours
        },
        "results": {
            "energy_stored_kwh": round(energy_stored_kwh, 2),
            "energy_grid_consumed_kwh": round(energy_grid_kwh, 2),
            "estimated_time_hours": round(estimated_time_hours, 2),
            "formatted_time": f"{hours_int} hr {minutes_int} min" if hours_int > 0 else f"{minutes_int} min",
            "estimated_cost_inr": round(estimated_cost_inr, 2),
            "is_feasible": is_feasible,
            "time_margin_hours": round(time_margin_hours, 2),
            "min_required_charger_kw": round(min_charger_power_kw, 2)
        },
        "schedule": schedule_steps,
        "assumptions": [
            f"Charging efficiency assumption: {opt.charging_efficiency_pct:.1f}% grid-to-battery energy conversion.",
            "Electricity pricing calculated at flat rate without Time-of-Day (ToD) penalties.",
            "Cell thermal throttling assumed within safe operational range (ambient 25°C-35°C)."
        ]
    }

@app.get("/analytics/summary", tags=["Analytics"])
def get_analytics_summary():
    """Returns dataset summary, voltage statistics, and preview records for the analytics dashboard."""
    global cached_dataset_summary
    if cached_dataset_summary is not None:
        return cached_dataset_summary

    if not os.path.exists(DATASET_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Primary dataset Battery_dataset.xlsx not found."
        )

    df = pd.read_excel(DATASET_PATH, sheet_name="data")
    
    # Calculate statistics for key metrics
    v_mean_col = pd.to_numeric(df["Voltage_Mean_V"], errors="coerce")
    v_min_col = pd.to_numeric(df["Voltage_Min_V"], errors="coerce")
    v_max_col = pd.to_numeric(df["Voltage_Max_V"], errors="coerce")
    v_range_col = pd.to_numeric(df["Voltage_Range_V"], errors="coerce")
    v_std_col = pd.to_numeric(df["Voltage_Std_V"], errors="coerce")

    # Sample voltage profile from row 0 for individual curve visualization
    voltage_curve_points = []
    row0 = df.iloc[0]
    for i in range(1, 41):  # sample first 40 voltage points
        v_col_name = f"Voltage_{i}"
        if v_col_name in df.columns:
            val = row0[v_col_name]
            if pd.notna(val):
                voltage_curve_points.append({
                    "sample": i,
                    "voltage": round(float(val), 4)
                })

    # Distribution of battery chemistry types
    type_counts = df["Type of battry"].value_counts().to_dict()
    type_names = {1: "LFP", 2: "NiCd", 3: "NMC"}
    chem_dist = [{"type": type_names.get(int(k), f"Type {k}"), "count": int(v)} for k, v in type_counts.items()]

    # Preview rows (clean representation of first 10 rows)
    preview_cols = [
        "CC", "CH 1/Dis 0", "Type of battry", "C-rate", "Current_Cycle_Number_Input",
        "Voltage_Min_V", "Voltage_Max_V", "Voltage_Mean_V", "Voltage_Std_V",
        "SOC_Mean_pct", "SOH_Estimated_pct", "RUL_Estimated_Cycles"
    ]
    preview_df = df[[c for c in preview_cols if c in df.columns]].head(10).fillna(0)
    records_preview = preview_df.to_dict(orient="records")

    summary = {
        "dataset_name": "Battery_dataset.xlsx",
        "sheet_name": "data",
        "total_records": len(df),
        "total_columns": len(df.columns),
        "voltage_statistics": {
            "mean_voltage": {
                "avg": round(float(v_mean_col.mean()), 4),
                "min": round(float(v_mean_col.min()), 4),
                "max": round(float(v_mean_col.max()), 4),
                "std": round(float(v_mean_col.std()), 4)
            },
            "min_voltage": {
                "avg": round(float(v_min_col.mean()), 4),
                "min": round(float(v_min_col.min()), 4),
                "max": round(float(v_min_col.max()), 4)
            },
            "max_voltage": {
                "avg": round(float(v_max_col.mean()), 4),
                "min": round(float(v_max_col.min()), 4),
                "max": round(float(v_max_col.max()), 4)
            },
            "voltage_range": {
                "avg": round(float(v_range_col.mean()), 4),
                "min": round(float(v_range_col.min()), 4),
                "max": round(float(v_range_col.max()), 4)
            },
            "voltage_variation": {
                "avg_std": round(float(v_std_col.mean()), 4),
                "min_std": round(float(v_std_col.min()), 4),
                "max_std": round(float(v_std_col.max()), 4)
            }
        },
        "temperature_statistics": {
            "status": "Not Available",
            "message": "Temperature sensors were not logged in this experimental dataset run."
        },
        "chemistry_distribution": chem_dist,
        "sample_voltage_profile": voltage_curve_points,
        "preview_columns": [c for c in preview_cols if c in df.columns],
        "records_preview": records_preview,
        "evaluation_metrics": evaluation_metrics,
        "ml_framework": "CatBoost",
        "dataset_label_disclosure": models_metadata.get("dataset_label_disclosure", {
            "status": "Filled with proxy-based assumptions; not measured/validated labels",
            "is_ground_truth_measured": False,
            "note": "SOH and RUL targets are assumption-based proxy estimates calculated from voltage behavior and cycling assumptions rather than destructive physical end-of-life teardown."
        })
    }

    cached_dataset_summary = summary
    return summary

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting EV Battery Life & Smart Charging API on port {port}...")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

