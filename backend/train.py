import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from catboost import CatBoostRegressor

def train_and_export():
    dataset_path = os.path.join(os.path.dirname(__file__), "data", "Battery_dataset.xlsx")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")
    
    print(f"Loading dataset from {dataset_path}...")
    df = pd.read_excel(dataset_path, sheet_name="data")
    print(f"Loaded {len(df)} records with {len(df.columns)} columns.")
    
    # 14 input feature columns matching operational battery parameters and voltage profiles
    feature_cols = [
        "CC",
        "CH 1/Dis 0",
        "Type of battry",
        "C-rate",
        "Current_Cycle_Number_Input",
        "Voltage_Min_V",
        "Voltage_Max_V",
        "Voltage_Mean_V",
        "Voltage_Std_V",
        "Voltage_Range_V",
        "Voltage_Median_V",
        "Voltage_Start_V",
        "Voltage_End_V",
        "Voltage_Coefficient_of_Variation"
    ]
    
    # Verify all input features exist in the dataset
    for col in feature_cols:
        if col not in df.columns:
            raise ValueError(f"Required feature column '{col}' missing from dataset sheet 'data'!")
            
    # Target label definitions
    target_defs = {
        "soc": {
            "target_col": "SOC_Mean_pct",
            "unit": "%",
            "name": "State of Charge (SOC)",
            "description": "Estimated mean State of Charge percentage"
        },
        "soh": {
            "target_col": "SOH_Estimated_pct",
            "unit": "%",
            "name": "State of Health (SOH)",
            "description": "Estimated State of Health percentage relative to nominal capacity"
        },
        "rul": {
            "target_col": "RUL_Estimated_Cycles",
            "unit": "cycles",
            "name": "Remaining Useful Life (RUL)",
            "description": "Estimated remaining useful cycles before reaching 80% EOL threshold"
        }
    }
    
    # Clean and prepare input features matrix
    X_raw = df[feature_cols].copy()
    for col in feature_cols:
        X_raw[col] = pd.to_numeric(X_raw[col], errors='coerce')
        if X_raw[col].isna().any():
            X_raw[col] = X_raw[col].fillna(X_raw[col].median())
            
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    all_metrics = {}
    saved_models_info = {}
    
    # Check dataset notes for target labeling disclosure
    label_status_val = str(df["SOH_RUL_Label_Status"].dropna().iloc[0]) if "SOH_RUL_Label_Status" in df.columns and len(df["SOH_RUL_Label_Status"].dropna()) > 0 else "Estimated Proxy"
    label_method_val = str(df["SOH_RUL_Method"].dropna().iloc[0]) if "SOH_RUL_Method" in df.columns and len(df["SOH_RUL_Method"].dropna()) > 0 else "Assumption-based proxy calculation"
    
    print("\n---------------------------------------------------------")
    print("Training CatBoost Regressors (CatBoost Only ML Pipeline)")
    print("---------------------------------------------------------")
    
    for target_key, t_info in target_defs.items():
        t_col = t_info["target_col"]
        print(f"\nTarget: {t_col} ({t_info['name']})")
        
        if t_col not in df.columns:
            print(f"Skipping {target_key}: Column '{t_col}' not found in dataset.")
            continue
            
        y_raw = pd.to_numeric(df[t_col], errors='coerce')
        valid_idx = y_raw.notna()
        
        if valid_idx.sum() == 0:
            print(f"Skipping {target_key}: No valid numeric values in column '{t_col}'.")
            continue
            
        X = X_raw.loc[valid_idx].reset_index(drop=True)
        y = y_raw.loc[valid_idx].reset_index(drop=True)
        
        # 80/20 train/test split with fixed seed for reproducible evaluation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Initialize CatBoost Regressor
        catboost_model = CatBoostRegressor(
            iterations=250,
            depth=4,
            learning_rate=0.04,
            loss_function='RMSE',
            random_seed=42,
            verbose=0
        )
        
        # Train CatBoost
        catboost_model.fit(X_train, y_train)
        
        # Predict on held-out test set
        preds = catboost_model.predict(X_test)
        
        # Calculate real evaluation metrics
        mae = float(mean_absolute_error(y_test, preds))
        mse = float(mean_squared_error(y_test, preds))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_test, preds))
        
        print(f"  Test Set Evaluation -> MAE: {mae:8.4f} | RMSE: {rmse:8.4f} | R2: {r2:8.4f}")
        
        # Save fitted CatBoost model using Joblib
        model_filename = f"{target_key}_model.joblib"
        model_path = os.path.join(models_dir, model_filename)
        joblib.dump(catboost_model, model_path)
        print(f"  Saved fitted model to: {model_path}")
        
        metrics_entry = {
            "target_column": t_col,
            "target_name": t_info["name"],
            "unit": t_info["unit"],
            "description": t_info["description"],
            "model_type": "CatBoostRegressor",
            "hyperparameters": {
                "iterations": 250,
                "depth": 4,
                "learning_rate": 0.04,
                "loss_function": "RMSE",
                "random_seed": 42
            },
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "metrics": {
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "r2": round(r2, 4)
            }
        }
        all_metrics[target_key] = metrics_entry
        
        saved_models_info[target_key] = {
            "model_file": model_filename,
            "model_type": "CatBoostRegressor",
            "target": t_col,
            "unit": t_info["unit"],
            "test_mae": round(mae, 4),
            "test_rmse": round(rmse, 4),
            "test_r2": round(r2, 4)
        }
        
    # Feature metadata and schema
    metadata = {
        "dataset_name": "Battery_dataset.xlsx",
        "sheet_name": "data",
        "total_records": len(df),
        "ml_framework": "CatBoost",
        "dataset_label_disclosure": {
            "status": label_status_val,
            "method": label_method_val,
            "is_ground_truth_measured": False,
            "note": "SOH and RUL targets are assumption-based proxy estimates calculated from voltage behavior and cycling assumptions rather than destructive physical end-of-life teardown."
        },
        "feature_names": feature_cols,
        "feature_count": len(feature_cols),
        "feature_details": {
            "CC": {"label": "Constant Current (CC)", "unit": "A", "type": "numeric", "default": 1.5},
            "CH 1/Dis 0": {"label": "Charge / Discharge State", "unit": "1=Charge, 0=Discharge", "type": "categorical_binary", "default": 1},
            "Type of battry": {"label": "Battery Chemistry Type", "unit": "1=LFP, 2=NiCd, 3=NMC", "type": "categorical", "default": 1},
            "C-rate": {"label": "C-rate", "unit": "C", "type": "numeric", "default": 1.5},
            "Current_Cycle_Number_Input": {"label": "Current Cycle Number", "unit": "cycles", "type": "numeric", "default": 25},
            "Voltage_Min_V": {"label": "Voltage Min", "unit": "V", "type": "numeric", "default": 2.65},
            "Voltage_Max_V": {"label": "Voltage Max", "unit": "V", "type": "numeric", "default": 3.65},
            "Voltage_Mean_V": {"label": "Voltage Mean", "unit": "V", "type": "numeric", "default": 3.49},
            "Voltage_Std_V": {"label": "Voltage Standard Deviation", "unit": "V", "type": "numeric", "default": 0.136},
            "Voltage_Range_V": {"label": "Voltage Range (Max - Min)", "unit": "V", "type": "numeric", "default": 1.00},
            "Voltage_Median_V": {"label": "Voltage Median", "unit": "V", "type": "numeric", "default": 3.51},
            "Voltage_Start_V": {"label": "Voltage Start", "unit": "V", "type": "numeric", "default": 2.65},
            "Voltage_End_V": {"label": "Voltage End", "unit": "V", "type": "numeric", "default": 3.65},
            "Voltage_Coefficient_of_Variation": {"label": "Voltage Coefficient of Variation (Std / Mean)", "unit": "ratio", "type": "numeric", "default": 0.039}
        },
        "target_models": saved_models_info
    }
    
    metadata_path = os.path.join(models_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    eval_path = os.path.join(models_dir, "evaluation_metrics.json")
    with open(eval_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
        
    print("\nTraining complete! CatBoost models, metadata, and evaluation metrics saved to:", models_dir)

if __name__ == "__main__":
    train_and_export()
