import React, { useState } from 'react';
import { 
  Activity, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  Gauge, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Battery, 
  SlidersHorizontal, 
  Calendar 
} from 'lucide-react';
import { api } from '../services/api';

// Exactly THREE supported EV Battery Options matching the trained CatBoost dataset
const THREE_BATTERY_OPTIONS = [
  {
    id: 1,
    name: 'Lithium Iron Phosphate (LFP)',
    short: 'LFP',
    tag: 'Long Lifespan & Thermal Stability',
    desc: 'Standard in mass-market EVs (e.g., Tata Nexon, BYD). 3.2V nominal plateau.',
    typicalCapacity: 40.5,
    typicalCycles: 25
  },
  {
    id: 3,
    name: 'Nickel Manganese Cobalt (NMC)',
    short: 'NMC',
    tag: 'High Energy Density & Range',
    desc: 'Common in performance EVs (e.g., MG ZS, Tesla LR). 3.7V nominal cell voltage.',
    typicalCapacity: 50.3,
    typicalCycles: 40
  },
  {
    id: 2,
    name: 'Nickel-Cadmium (NiCd)',
    short: 'NiCd',
    tag: 'Heavy Industrial & Fleet',
    desc: 'Robust commercial fleet chemistry with extreme temperature tolerance.',
    typicalCapacity: 30.0,
    typicalCycles: 60
  }
];

export default function BatteryPrediction({ onPredictionSuccess, lastPrediction, onNavigate }) {
  const [formData, setFormData] = useState({
    Type_of_battry: 1,
    battery_capacity_kwh: 50.0,
    Current_Cycle_Number_Input: 25.0,
    battery_age_years: '',
    useAgeCalculation: false,
    CH_1_Dis_0: 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionResult, setPredictionResult] = useState(lastPrediction || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'battery_age_years') {
      const ageVal = value === '' ? '' : parseFloat(value);
      const derivedCycles = ageVal !== '' && !isNaN(ageVal) ? Math.max(0, Math.round(ageVal * 180)) : 25;
      setFormData(prev => ({
        ...prev,
        battery_age_years: ageVal,
        Current_Cycle_Number_Input: derivedCycles
      }));
    } else {
      const numVal = value === '' ? '' : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: numVal
      }));
    }
  };

  const handleSelectChemistry = (opt) => {
    setFormData(prev => ({
      ...prev,
      Type_of_battry: opt.id,
      battery_capacity_kwh: opt.typicalCapacity,
      Current_Cycle_Number_Input: opt.typicalCycles,
      battery_age_years: ''
    }));
    setError(null);
  };

  const handleReset = () => {
    setFormData({
      Type_of_battry: 1,
      battery_capacity_kwh: 50.0,
      Current_Cycle_Number_Input: 25.0,
      battery_age_years: '',
      useAgeCalculation: false,
      CH_1_Dis_0: 1
    });
    setPredictionResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.battery_capacity_kwh <= 0) {
      setError("Please enter a valid battery pack capacity greater than 0 kWh.");
      setLoading(false);
      return;
    }

    if (formData.Current_Cycle_Number_Input < 0) {
      setError("Charging cycles cannot be negative.");
      setLoading(false);
      return;
    }

    const payload = {
      Type_of_battry: parseInt(formData.Type_of_battry),
      Current_Cycle_Number_Input: parseFloat(formData.Current_Cycle_Number_Input) || 0,
      CH_1_Dis_0: parseInt(formData.CH_1_Dis_0)
    };

    try {
      const result = await api.predictAll(payload);
      result.battery_capacity_kwh = formData.battery_capacity_kwh;
      setPredictionResult(result);
      if (onPredictionSuccess) {
        onPredictionSuccess(result);
      }
    } catch (err) {
      setError(err.message || "Failed to retrieve predictions from CatBoost backend.");
    } finally {
      setLoading(false);
    }
  };

  const soc = predictionResult?.predictions?.soc;
  const soh = predictionResult?.predictions?.soh;
  const rul = predictionResult?.predictions?.rul;

  const socValue = soc ? soc.predicted_value : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (socValue / 100) * circumference;

  return (
    <div className="space-y-8 pb-12">
      {/* Title & 3 Battery Options Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16a34a]">
                <Activity className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-[#0f244a] tracking-tight">
                Battery Health Prediction
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

        {/* Exactly THREE Supported Battery Options */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
            Select Your EV Battery Option (3 Supported Chemistries):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {THREE_BATTERY_OPTIONS.map((opt) => {
              const isSelected = formData.Type_of_battry === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectChemistry(opt)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/50 border-[#16a34a] ring-1 ring-[#16a34a] shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#0f244a]">{opt.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isSelected ? 'bg-[#16a34a] text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {opt.short}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight">{opt.tag}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: User Inputs */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0f244a] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#16a34a]" />
              <span>EV Battery Information</span>
            </h2>

          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Battery Chemistry Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Battery Chemistry Type <span className="text-[#16a34a]">*</span>
              </label>
              <select
                name="Type_of_battry"
                value={formData.Type_of_battry}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
              >
                <option value={1}>Lithium Iron Phosphate (LFP) - Standard Range &amp; Long Life</option>
                <option value={3}>Nickel Manganese Cobalt (NMC) - Extended Range &amp; Performance</option>
                <option value={2}>Nickel-Cadmium (NiCd) - Industrial Fleet Chemistry</option>
              </select>
            </div>

            {/* 2. Battery Pack Capacity */}
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

            {/* 3. Usage: Cycles or Age */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Usage History <span className="text-[#16a34a]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, useAgeCalculation: !p.useAgeCalculation }))}
                  className="text-[11px] text-[#16a34a] hover:text-[#15803d] font-semibold flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formData.useAgeCalculation ? 'Enter exact cycle count' : "Don't know cycles? Use battery age"}</span>
                </button>
              </div>

              {formData.useAgeCalculation ? (
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="20"
                      name="battery_age_years"
                      value={formData.battery_age_years}
                      onChange={handleChange}
                      placeholder="e.g. 1.5"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] pr-16 transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">
                      years
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
                    <span>Estimated usage (~180 cycles/year):</span>
                    <strong className="text-[#16a34a] font-mono font-bold">
                      {formData.Current_Cycle_Number_Input} cycles
                    </strong>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="3000"
                      name="Current_Cycle_Number_Input"
                      value={formData.Current_Cycle_Number_Input}
                      onChange={handleChange}
                      placeholder="e.g. 25"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] pr-16 transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">
                      cycles
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Operating Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Operating Mode <span className="text-[#16a34a]">*</span>
              </label>
              <select
                name="CH_1_Dis_0"
                value={formData.CH_1_Dis_0}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
              >
                <option value={1}>Charging Mode (Plugged in or charging)</option>
                <option value={0}>Driving / Discharging Mode (Vehicle in motion)</option>
              </select>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing AI Battery Predictions...</span>
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 text-white" />
                  <span>Predict Battery Health</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Prediction Outputs */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0f244a] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#16a34a]" />
              <span>AI Prediction Results</span>
            </h2>

          </div>

          {predictionResult ? (
            <div className="space-y-4">
              {/* Overall Status */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#16a34a] text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Overall Condition</div>
                    <div className="text-base font-bold text-[#0f244a]">{predictionResult.overall_condition}</div>
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-slate-500">
                  Cycle #{formData.Current_Cycle_Number_Input}
                </div>
              </div>

              {/* CARD 1: SOC */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-xs font-bold text-[#0f244a]">State of Charge (SOC)</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#16a34a]">
                    {soc?.status || 'Optimal'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <span className="text-3xl font-black text-[#0f244a] font-mono">
                      {soc?.predicted_value?.toFixed(1)}%
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">Available charge level</span>
                  </div>
                  {/* Circular Gauge */}
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-bold text-[#0f244a] font-mono">
                      {Math.round(socValue)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: SOH */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-xs font-bold text-[#0f244a]">State of Health (SOH)</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#16a34a]">
                    {soh?.status || 'Good'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-3xl font-black text-[#16a34a] font-mono">
                    {soh?.predicted_value?.toFixed(2)}%
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Capacity Retention</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, soh?.predicted_value || 0))}%` }}
                  />
                </div>
              </div>

              {/* CARD 3: RUL */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#16a34a]" />
                    <span className="text-xs font-bold text-[#0f244a]">Remaining Useful Life (RUL)</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {rul?.status || 'Nominal'}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-[#0f244a] font-mono">
                    {rul?.predicted_value?.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#16a34a] font-bold uppercase font-mono">
                    CYCLES
                  </span>
                </div>
              </div>

              {/* Continue Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('charging')}
                  className="flex-1 py-3 px-4 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>Use SOC in Smart Charging</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('dashboard')}
                  className="py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-all text-center"
                >
                  <span>View Dashboard</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Battery className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#0f244a]">Awaiting Battery Information</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Select your battery chemistry, enter cycles, and click <strong className="text-[#16a34a]">Predict Battery Health</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
