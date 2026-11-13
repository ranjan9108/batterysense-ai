import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Calculator, 
  Clock, 
  IndianRupee, 
  AlertTriangle, 
  Info,
  ArrowRight,
  BatteryCharging
} from 'lucide-react';
import { api } from '../services/api';

export default function SmartCharging({ onChargingOptimized, lastChargingResult, latestPrediction, onNavigate }) {
  const predictedSoc = latestPrediction?.predictions?.soc?.predicted_value;
  const initialCapacity = latestPrediction?.battery_capacity_kwh || 50.0;

  const [formData, setFormData] = useState({
    battery_capacity_kwh: initialCapacity,
    current_charge_pct: predictedSoc !== undefined ? Math.round(predictedSoc) : 20.0,
    desired_charge_pct: 80.0,
    charger_power_kw: 7.4,
    tariff_inr_per_kwh: 8.5
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(lastChargingResult || null);

  useEffect(() => {
    if (predictedSoc !== undefined && !lastChargingResult) {
      setFormData(prev => ({
        ...prev,
        current_charge_pct: Math.min(99, Math.max(0, Math.round(predictedSoc))),
        battery_capacity_kwh: initialCapacity
      }));
    }
  }, [predictedSoc, initialCapacity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value)
    }));
  };

  const handleReset = () => {
    setFormData({
      battery_capacity_kwh: 50.0,
      current_charge_pct: predictedSoc !== undefined ? Math.round(predictedSoc) : 20.0,
      desired_charge_pct: 80.0,
      charger_power_kw: 7.4,
      tariff_inr_per_kwh: 8.5
    });
    setResult(null);
    setError(null);
  };

  const handleCalculate = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.desired_charge_pct <= formData.current_charge_pct) {
      setError("Target charge percentage must be greater than current battery charge percentage.");
      setLoading(false);
      return;
    }

    if (formData.battery_capacity_kwh <= 0 || formData.charger_power_kw <= 0) {
      setError("Battery capacity and charger power must be greater than zero.");
      setLoading(false);
      return;
    }

    if (formData.tariff_inr_per_kwh < 0) {
      setError("Electricity tariff cannot be negative.");
      setLoading(false);
      return;
    }

    const payload = {
      battery_capacity_kwh: parseFloat(formData.battery_capacity_kwh),
      current_charge_pct: parseFloat(formData.current_charge_pct),
      desired_charge_pct: parseFloat(formData.desired_charge_pct),
      charger_power_kw: parseFloat(formData.charger_power_kw),
      tariff_inr_per_kwh: parseFloat(formData.tariff_inr_per_kwh),
      charging_efficiency_pct: 90.0,
      available_time_hours: 8.0
    };

    try {
      const res = await api.optimizeCharging(payload);
      setResult(res);
      if (onChargingOptimized) {
        onChargingOptimized(res);
      }
    } catch (err) {
      setError(err.message || "Failed to calculate smart charging parameters.");
    } finally {
      setLoading(false);
    }
  };

  const r = result?.results;

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16a34a]">
                <Zap className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#0f244a] tracking-tight">
                Smart Charging Optimizer
              </h1>
            </div>

          </div>

          <button
            type="button"
            onClick={handleReset}
            className="self-start md:self-auto px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold border border-slate-200 flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Form</span>
          </button>
        </div>
      </div>

      {/* Main Form & Calculation Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Clean Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0f244a] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#16a34a]" />
              <span>Charging Parameters</span>
            </h2>
            {predictedSoc !== undefined && (
              <span className="text-[11px] font-mono text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-semibold">
                AI Predicted SOC: {predictedSoc.toFixed(1)}%
              </span>
            )}
          </div>

          <form onSubmit={handleCalculate} className="space-y-5">
            {/* 1. Battery capacity (kWh) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Battery Pack Capacity <span className="text-[#16a34a]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="200"
                  name="battery_capacity_kwh"
                  value={formData.battery_capacity_kwh}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] pr-16 transition-all"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">
                  kWh
                </span>
              </div>
            </div>

            {/* 2. Current Charge % & 3. Target Charge % */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Charge Percentage <span className="text-[#16a34a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="99"
                    name="current_charge_pct"
                    value={formData.current_charge_pct}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] pr-10 transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Charge Percentage <span className="text-[#16a34a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    name="desired_charge_pct"
                    value={formData.desired_charge_pct}
                    onChange={handleChange}
                    placeholder="e.g. 80"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] pr-10 transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* 4. Charger Power & 5. Electricity Tariff */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Charger Power Output <span className="text-[#16a34a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="150"
                    name="charger_power_kw"
                    value={formData.charger_power_kw}
                    onChange={handleChange}
                    placeholder="e.g. 7.4"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] pr-10 transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">kW</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Electricity Tariff <span className="text-[#16a34a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="tariff_inr_per_kwh"
                    value={formData.tariff_inr_per_kwh}
                    onChange={handleChange}
                    placeholder="e.g. 8.5"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] pr-20 transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">₹ / kWh</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm tracking-wide shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Smart Charging Plan...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-white" />
                  <span>Calculate Smart Charging</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Results Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0f244a] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#16a34a]" />
              <span>Calculated Charging Plan</span>
            </h2>
          </div>

          {r ? (
            <div className="space-y-4">
              {/* 1. Required Energy */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Required Charging Energy
                </span>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-[#0f244a] font-mono">
                    {r.energy_stored_kwh}
                  </span>
                  <span className="text-xs text-[#16a34a] font-mono font-bold">
                    kWh Net Stored
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Grid Drawn (with 90% efficiency):</span>
                  <span className="font-mono text-slate-800 font-bold">{r.energy_grid_consumed_kwh} kWh</span>
                </div>
              </div>

              {/* 2. Estimated Time */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500">Estimated Charging Time</span>
                  <Clock className="w-4 h-4 text-[#16a34a]" />
                </div>
                <div className="text-3xl font-black text-[#0f244a] font-mono">
                  {r.formatted_time}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                  <span>Total Duration:</span>
                  <span className="font-mono text-slate-800 font-bold">{r.estimated_time_hours} hours</span>
                </div>
              </div>

              {/* 3. Estimated Cost */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500">Estimated Charging Cost</span>
                  <IndianRupee className="w-4 h-4 text-[#16a34a]" />
                </div>
                <div className="text-3xl font-black text-[#16a34a] font-mono">
                  ₹{r.estimated_cost_inr.toFixed(2)}
                </div>
                <span className="text-[11px] text-slate-500">
                  (@ ₹{formData.tariff_inr_per_kwh}/kWh)
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="w-full py-3.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all"
              >
                <span>View Full Results in Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <BatteryCharging className="w-6 h-6 text-[#16a34a]" />
              </div>
              <h3 className="text-sm font-bold text-[#0f244a]">Awaiting Charging Details</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click <strong className="text-[#16a34a]">Calculate Smart Charging</strong> to compute your energy demand, time, and session cost in ₹.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
