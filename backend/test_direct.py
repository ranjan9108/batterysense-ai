from main import (
    app,
    health_check,
    get_features,
    predict_soc,
    predict_soh,
    predict_rul,
    predict_all,
    optimize_charging,
    get_analytics_summary,
    BatteryFeaturesInput,
    ChargingOptimizerInput
)

def run_tests():
    print("Testing health_check()...")
    h = health_check()
    print("  Health:", h)
    assert h["status"] == "online"

    print("\nTesting get_features()...")
    f = get_features()
    print(f"  Features count: {f['feature_count']}")
    assert f["feature_count"] == 14

    sample_input = BatteryFeaturesInput(
        CC=1.5,
        CH_1_Dis_0=1,
        Type_of_battry=1,
        C_rate=1.5,
        Current_Cycle_Number_Input=25.0,
        Voltage_Min_V=2.65,
        Voltage_Max_V=3.65,
        Voltage_Mean_V=3.49,
        Voltage_Std_V=0.136,
        Voltage_Range_V=1.0,
        Voltage_Median_V=3.51,
        Voltage_Start_V=2.65,
        Voltage_End_V=3.65,
        Voltage_Coefficient_of_Variation=0.039
    )

    print("\nTesting predict_soc()...")
    soc = predict_soc(sample_input)
    print("  SOC output:", soc)
    assert "predicted_value" in soc

    print("\nTesting predict_soh()...")
    soh = predict_soh(sample_input)
    print("  SOH output:", soh)
    assert "predicted_value" in soh

    print("\nTesting predict_rul()...")
    rul = predict_rul(sample_input)
    print("  RUL output:", rul)
    assert "predicted_value" in rul

    print("\nTesting predict_all()...")
    all_res = predict_all(sample_input)
    print("  All output:", all_res)
    assert all_res["status"] == "success"

    print("\nTesting optimize_charging()...")
    charging_input = ChargingOptimizerInput(
        current_charge_pct=20.0,
        desired_charge_pct=80.0,
        battery_capacity_kwh=50.0,
        charger_power_kw=7.4,
        tariff_inr_per_kwh=8.5,
        charging_efficiency_pct=92.0,
        available_time_hours=6.0
    )
    charge_res = optimize_charging(charging_input)
    print("  Charging output:", charge_res["results"])
    assert charge_res["status"] == "success"

    print("\nTesting get_analytics_summary()...")
    summary = get_analytics_summary()
    print(f"  Summary records: {summary['total_records']}, columns: {summary['total_columns']}")
    assert summary["total_records"] == 80

    print("\n==============================================")
    print(">>> ALL DIRECT BACKEND TESTS PASSED 100%! <<<")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
