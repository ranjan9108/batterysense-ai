import React, { useState } from 'react';
import { 
  Zap, 
  Activity, 
  Calculator, 
  ArrowRight, 
  ShieldCheck, 
  Gauge, 
  Clock, 
  Sparkles,
  Layers,
  Battery,
  Calendar,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Info,
  SlidersHorizontal,
  IndianRupee,
  BatteryCharging
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../services/api';

// Exactly THREE Supported EV Battery Chemistries
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
    tag: 'Heavy Industrial & Commercial Fleet',
    desc: 'Robust fleet chemistry with extreme temperature tolerance.',
    typicalCapacity: 30.0,
    typicalCycles: 60
  }
];

export default function LandingPage({ 
  onNavigate, 
  latestPrediction, 
  latestCharging, 
  onPredictionSuccess, 
  onChargingOptimized 
}) {
  // Local Prediction Form State
  const [predForm, setPredForm] = useState({
    Type_of_battry: 1,
    battery_capacity_kwh: 50.0,
    Current_Cycle_Number_Input: 25.0,
    battery_age_years: '',
    useAgeCalculation: false,
    CH_1_Dis_0: 1
  });
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);
  const [localPrediction, setLocalPrediction] = useState(latestPrediction || null);

  // Local Charging Form State
  const activePredSoc = localPrediction?.predictions?.soc?.predicted_value || latestPrediction?.predictions?.soc?.predicted_value;
  const activeCapacity = localPrediction?.battery_capacity_kwh || latestPrediction?.battery_capacity_kwh || 50.0;

  const [chargeForm, setChargeForm] = useState({
    battery_capacity_kwh: activeCapacity,
    current_charge_pct: activePredSoc !== undefined ? Math.round(activePredSoc) : 20.0,
    desired_charge_pct: 80.0,
    charger_power_kw: 7.4,
    tariff_inr_per_kwh: 8.5
  });
  const [chargeLoading, setChargeLoading] = useState(false);
  const [chargeError, setChargeError] = useState(null);
  const [localCharging, setLocalCharging] = useState(latestCharging || null);

  // Sync prediction when external props change
  React.useEffect(() => {
    if (latestPrediction) setLocalPrediction(latestPrediction);
  }, [latestPrediction]);

  React.useEffect(() => {
    if (latestCharging) setLocalCharging(latestCharging);
  }, [latestCharging]);

  // Handle Prediction Form Change
  const handlePredChange = (e) => {
    const { name, value } = e.target;
    if (name === 'battery_age_years') {
      const ageVal = value === '' ? '' : parseFloat(value);
      const derivedCycles = ageVal !== '' && !isNaN(ageVal) ? Math.max(0, Math.round(ageVal * 180)) : 25;
      setPredForm(prev => ({
        ...prev,
        battery_age_years: ageVal,
        Current_Cycle_Number_Input: derivedCycles
      }));
    } else {
      const numVal = value === '' ? '' : parseFloat(value);
      setPredForm(prev => ({
        ...prev,
        [name]: numVal
      }));
    }
  };

  const handleSelectChemistry = (opt) => {
    setPredForm(prev => ({
      ...prev,
      Type_of_battry: opt.id,
      battery_capacity_kwh: opt.typicalCapacity,
      Current_Cycle_Number_Input: opt.typicalCycles,
      battery_age_years: ''
    }));
    setPredError(null);
  };

  // Run CatBoost Prediction
  const handleRunPrediction = async (e) => {
    if (e) e.preventDefault();
    setPredLoading(true);
    setPredError(null);

    if (predForm.battery_capacity_kwh <= 0) {
      setPredError("Please enter a valid battery pack capacity greater than 0 kWh.");
      setPredLoading(false);
      return;
    }

    if (predForm.Current_Cycle_Number_Input < 0) {
      setPredError("Charging cycles cannot be negative.");
      setPredLoading(false);
      return;
    }

    const payload = {
      Type_of_battry: parseInt(predForm.Type_of_battry),
      Current_Cycle_Number_Input: parseFloat(predForm.Current_Cycle_Number_Input) || 0,
      CH_1_Dis_0: parseInt(predForm.CH_1_Dis_0)
    };

    try {
      const result = await api.predictAll(payload);
      result.battery_capacity_kwh = predForm.battery_capacity_kwh;
      setLocalPrediction(result);
      if (onPredictionSuccess) onPredictionSuccess(result);

      // Pre-fill charging calculator with predicted SOC and capacity
      if (result?.predictions?.soc?.predicted_value !== undefined) {
        setChargeForm(prev => ({
          ...prev,
          current_charge_pct: Math.round(result.predictions.soc.predicted_value),
          battery_capacity_kwh: predForm.battery_capacity_kwh
        }));
      }

      // Smooth scroll to prediction results
      const resEl = document.getElementById('prediction-results');
      if (resEl) {
        resEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setPredError(err.message || "Failed to retrieve predictions from CatBoost backend.");
    } finally {
      setPredLoading(false);
    }
  };

  // Handle Charging Form Change
  const handleChargeChange = (e) => {
    const { name, value } = e.target;
    setChargeForm(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value)
    }));
  };

  // Run Smart Charging Optimization
  const handleRunCharging = async (e) => {
    if (e) e.preventDefault();
    setChargeLoading(true);
    setChargeError(null);

    if (chargeForm.desired_charge_pct <= chargeForm.current_charge_pct) {
      setChargeError("Target charge percentage must be greater than current battery charge percentage.");
      setChargeLoading(false);
      return;
    }

    if (chargeForm.battery_capacity_kwh <= 0 || chargeForm.charger_power_kw <= 0) {
      setChargeError("Battery capacity and charger power must be greater than zero.");
      setChargeLoading(false);
      return;
    }

    if (chargeForm.tariff_inr_per_kwh < 0) {
      setChargeError("Electricity tariff cannot be negative.");
      setChargeLoading(false);
      return;
    }

    const payload = {
      battery_capacity_kwh: parseFloat(chargeForm.battery_capacity_kwh),
      current_charge_pct: parseFloat(chargeForm.current_charge_pct),
      desired_charge_pct: parseFloat(chargeForm.desired_charge_pct),
      charger_power_kw: parseFloat(chargeForm.charger_power_kw),
      tariff_inr_per_kwh: parseFloat(chargeForm.tariff_inr_per_kwh),
      charging_efficiency_pct: 90.0,
      available_time_hours: 8.0
    };

    try {
      const res = await api.optimizeCharging(payload);
      setLocalCharging(res);
      if (onChargingOptimized) onChargingOptimized(res);

      // Smooth scroll to dashboard section
      const dashEl = document.getElementById('dashboard-section');
      if (dashEl) {
        dashEl.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      setChargeError(err.message || "Failed to calculate smart charging parameters.");
    } finally {
      setChargeLoading(false);
    }
  };

  // Active Prediction & Charging values
  const activePred = localPrediction || latestPrediction;
  const activeCharge = localCharging || latestCharging;

  const socVal = activePred?.predictions?.soc?.predicted_value !== undefined ? activePred.predictions.soc.predicted_value : 76.0;
  const sohVal = activePred?.predictions?.soh?.predicted_value !== undefined ? activePred.predictions.soh.predicted_value : 99.0;
  const rulVal = activePred?.predictions?.rul?.predicted_value !== undefined ? activePred.predictions.rul.predicted_value : 420.0;
  const hasRealPrediction = !!activePred?.predictions?.soc;

  const chargingResults = activeCharge?.results;
  const hasRealCharging = !!chargingResults;
  const energyStored = hasRealCharging ? chargingResults.energy_stored_kwh : 30.0;
  const formattedTime = hasRealCharging ? chargingResults.formatted_time : '4 hr 30 min';
  const costInr = hasRealCharging ? chargingResults.estimated_cost_inr : 283.33;

  // Circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (socVal / 100) * circumference;

  // Chart data
  const startSoc = activeCharge?.inputs?.current_soc_pct || 20;
  const targetSoc = activeCharge?.inputs?.desired_soc_pct || 80;
  const totalHours = chargingResults?.estimated_time_hours || 4.5;
  const chargingCurveData = [
    { minute: 0, soc: startSoc },
    { minute: Math.round((totalHours * 60) * 0.25), soc: Math.round(startSoc + (targetSoc - startSoc) * 0.35) },
    { minute: Math.round((totalHours * 60) * 0.50), soc: Math.round(startSoc + (targetSoc - startSoc) * 0.70) },
    { minute: Math.round((totalHours * 60) * 0.75), soc: Math.round(startSoc + (targetSoc - startSoc) * 0.90) },
    { minute: Math.round(totalHours * 60), soc: targetSoc }
  ];

  const cycleBase = activePred?.input_summary?.current_cycle || 25;
  const degradationData = [
    { cycle: 0, soh: 100 },
    { cycle: Math.round(cycleBase), soh: +(sohVal).toFixed(2) },
    { cycle: Math.round(cycleBase + (rulVal) * 0.33), soh: +(Math.max(80, sohVal - (sohVal - 80) * 0.33)).toFixed(2) },
    { cycle: Math.round(cycleBase + (rulVal) * 0.66), soh: +(Math.max(80, sohVal - (sohVal - 80) * 0.66)).toFixed(2) },
    { cycle: Math.round(cycleBase + rulVal), soh: 80.0 }
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 md:space-y-24 pb-20">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION (Exact Reference Design)                      */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-4 md:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Heading, Supporting Text, Action Buttons */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0f244a] tracking-tight leading-[1.15]">
              Smarter Battery <br className="hidden sm:inline" />
              Insights for Every EV
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Monitor battery health, predict remaining battery life and make better charging decisions with AI-powered intelligence.
            </p>

            {/* The Two Core Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => scrollToSection('prediction-section')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-sm tracking-wide shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group"
              >
                <Activity className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                <span>Predict Battery Health</span>
              </button>

              <button
                onClick={() => scrollToSection('charging-section')}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-[#0f244a] font-semibold text-sm border border-slate-300 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 group"
              >
                <Zap className="w-4 h-4 text-[#16a34a] group-hover:scale-110 transition-transform" />
                <span>Smart Charging</span>
              </button>
            </div>
          </div>

          {/* Right Column: Battery Health Dashboard Preview Card (Exact Reference Look) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xl shadow-slate-200/50">
              <div className="grid grid-cols-12 gap-5 items-center">
                {/* Left: Realistic Vertical Battery Illustration */}
                <div className="col-span-5 flex flex-col items-center justify-center">
                  <div className="relative w-24 h-44 rounded-2xl border-2 border-slate-300 bg-slate-50 p-1.5 flex flex-col justify-end shadow-inner overflow-hidden">
                    {/* Metallic Silver Cap Pip */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 rounded-t-sm shadow-sm" />
                    
                    {/* Glowing Green Battery Liquid / Segments */}
                    <div 
                      className="w-full bg-gradient-to-t from-[#16a34a] to-[#22c55e] rounded-xl transition-all duration-700 relative overflow-hidden flex items-center justify-center"
                      style={{ height: `${Math.min(100, Math.max(15, Math.round(socVal)))}%` }}
                    >
                      {/* Segment Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-30">
                        <div className="w-full h-0.5 bg-white/40" />
                        <div className="w-full h-0.5 bg-white/40" />
                        <div className="w-full h-0.5 bg-white/40" />
                      </div>

                      {/* White Lightning Bolt in the Center */}
                      <Zap className="w-8 h-8 text-white fill-white drop-shadow-md z-10 animate-pulse" />
                    </div>
                  </div>

                </div>

                {/* Right: SOC, SOH, RUL Indicators (Exact Layout from Image) */}
                <div className="col-span-7 space-y-4">
                  {/* Row 1: State of Charge (SOC) */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[#16a34a]">
                        <Battery className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">State of Charge (SOC)</span>
                    </div>
                    <div className="text-lg font-extrabold text-[#0f244a] font-mono">
                      {socVal.toFixed(0)}%
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-1 overflow-hidden">
                      <div 
                        className="bg-[#16a34a] h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(0, socVal))}%` }}
                      />
                    </div>
                  </div>

                  {/* Row 2: State of Health (SOH) */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[#16a34a]">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">State of Health (SOH)</span>
                    </div>
                    <div className="text-lg font-extrabold text-[#0f244a] font-mono">
                      {sohVal.toFixed(0)}%
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-1 overflow-hidden">
                      <div 
                        className="bg-[#16a34a] h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, Math.max(0, sohVal))}%` }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Remaining Useful Life (RUL) */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-[#16a34a]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">Remaining Useful Life (RUL)</span>
                    </div>
                    <div className="text-lg font-extrabold text-[#16a34a] font-mono">
                      {Math.round(rulVal)} Cycles
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. THREE FEATURE HIGHLIGHT CARDS (Bottom of reference image)  */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16a34a] shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f244a]">Data-Driven Prediction</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                AI-powered estimation of SOC, SOH and RUL using real battery data.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16a34a] shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f244a]">Smart Charging</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Calculate required energy, charging time and cost for your next charge.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16a34a] shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f244a]">EV Battery Care</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Make informed charging decisions to extend battery life and reduce cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. BATTERY PREDICTION SECTION: "Check Your Battery Health"     */}
      {/* ------------------------------------------------------------- */}
      <section id="prediction-section" className="space-y-6 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">
            CatBoost ML Inference
          </span>
          <h2 className="text-3xl font-extrabold text-[#0f244a] tracking-tight">
            Check Your Battery Health
          </h2>
          <p className="text-slate-600 text-sm">
            Enter your battery details to receive intelligent battery predictions.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
          <form onSubmit={handleRunPrediction} className="space-y-6">
            {/* Battery Chemistry Type Selection (3 supported) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0f244a] mb-2.5">
                Select Battery Chemistry Type <span className="text-[#16a34a]">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {THREE_BATTERY_OPTIONS.map((opt) => {
                  const isSelected = predForm.Type_of_battry === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectChemistry(opt)}
                      className={`text-left p-4 rounded-xl border transition-all ${
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
                      <p className="text-[11px] text-slate-500 leading-relaxed">{opt.tag}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Capacity + Operating Mode Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                    value={predForm.battery_capacity_kwh}
                    onChange={handlePredChange}
                    placeholder="e.g. 50"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] pr-16 transition-all"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">
                    kWh
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nameplate energy rating of your EV battery pack.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Operating Mode <span className="text-[#16a34a]">*</span>
                </label>
                <select
                  name="CH_1_Dis_0"
                  value={predForm.CH_1_Dis_0}
                  onChange={handlePredChange}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] transition-all"
                >
                  <option value={1}>Charging Mode (Actively plugged in)</option>
                  <option value={0}>Driving / Discharging Mode (Vehicle in motion)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Current state of electrical flow.
                </p>
              </div>
            </div>

            {/* Usage Input: Charging Cycles vs Battery Age */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-800">
                  Usage History <span className="text-[#16a34a]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPredForm(p => ({ ...p, useAgeCalculation: !p.useAgeCalculation }))}
                  className="text-xs text-[#16a34a] hover:text-[#15803d] font-semibold flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{predForm.useAgeCalculation ? 'Switch to direct cycle count' : "Don't know cycles? Estimate from vehicle age"}</span>
                </button>
              </div>

              {predForm.useAgeCalculation ? (
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="20"
                      name="battery_age_years"
                      value={predForm.battery_age_years}
                      onChange={handlePredChange}
                      placeholder="e.g. 1.5"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] pr-16 transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">
                      years
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                    <span>Derived EV usage (~180 cycles/year):</span>
                    <strong className="text-[#16a34a] font-mono font-bold">
                      {predForm.Current_Cycle_Number_Input} cycles
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
                      value={predForm.Current_Cycle_Number_Input}
                      onChange={handlePredChange}
                      placeholder="e.g. 25"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] pr-16 transition-all"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">
                      cycles
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Completed charging cycles (~150 to 200 cycles per year of average EV driving).
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {predError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{predError}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={predLoading}
                className="w-full sm:w-auto px-10 py-3.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {predLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing with CatBoost ML...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 text-white" />
                    <span>Predict Battery Health</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. PREDICTION RESULTS SECTION: 3 Clean Professional Cards      */}
      {/* ------------------------------------------------------------- */}
      <section id="prediction-results" className="space-y-6 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">
            Verified Model Outputs
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f244a] tracking-tight">
            Battery Health Analysis Results
          </h2>
          <p className="text-slate-600 text-xs">
            Generated using our trained CatBoost machine learning model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Card 1: SOC */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  State of Charge
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#16a34a] font-bold">
                  SOC
                </span>
              </div>
              <div className="text-3xl font-black text-[#0f244a] font-mono mb-2">
                {socVal.toFixed(1)}%
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
                <div 
                  className="bg-[#16a34a] h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, socVal))}%` }}
                />
              </div>
            </div>

          </div>

          {/* Card 2: SOH */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  State of Health
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#16a34a] font-bold">
                  SOH
                </span>
              </div>
              <div className="text-3xl font-black text-[#16a34a] font-mono mb-2">
                {sohVal.toFixed(2)}%
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
                <div 
                  className="bg-[#16a34a] h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, sohVal))}%` }}
                />
              </div>
            </div>

          </div>

          {/* Card 3: RUL */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Remaining Useful Life
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#16a34a] font-bold">
                  RUL
                </span>
              </div>
              <div className="text-3xl font-black text-[#0f244a] font-mono mb-2">
                {Math.round(rulVal)} <span className="text-sm font-bold text-[#16a34a] uppercase">Cycles</span>
              </div>
              <div className="text-xs text-slate-600 mb-3">
                Estimated ~<strong className="text-slate-800 font-semibold">{Math.round(rulVal * 250).toLocaleString()} km</strong> driving range remaining.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. SMART CHARGING SECTION: "Plan Your Next Charge"            */}
      {/* ------------------------------------------------------------- */}
      <section id="charging-section" className="space-y-6 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">
            Charging Calculator
          </span>
          <h2 className="text-3xl font-extrabold text-[#0f244a] tracking-tight">
            Plan Your Next Charge
          </h2>
          <p className="text-slate-600 text-sm">
            Calculate required energy, charging time and electricity cost in ₹.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
          {/* Left Column: Form with exactly the 5 practical inputs */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f244a] border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#16a34a]" />
              <span>Charging Parameters</span>
            </h3>

            <form onSubmit={handleRunCharging} className="space-y-4">
              {/* 1. Battery capacity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Battery Pack Capacity <span className="text-[#16a34a]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    name="battery_capacity_kwh"
                    value={chargeForm.battery_capacity_kwh}
                    onChange={handleChargeChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] pr-14"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">
                    kWh
                  </span>
                </div>
              </div>

              {/* 2 & 3. Current & Target Charge Percentage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Charge <span className="text-[#16a34a]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="99"
                      name="current_charge_pct"
                      value={chargeForm.current_charge_pct}
                      onChange={handleChargeChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] pr-10"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Charge <span className="text-[#16a34a]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      name="desired_charge_pct"
                      value={chargeForm.desired_charge_pct}
                      onChange={handleChargeChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] pr-10"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">%</span>
                  </div>
                </div>
              </div>

              {/* 4 & 5. Charger Power & Electricity Tariff */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Charger Power <span className="text-[#16a34a]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      name="charger_power_kw"
                      value={chargeForm.charger_power_kw}
                      onChange={handleChargeChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] pr-12"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">kW</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Electricity Tariff <span className="text-[#16a34a]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="tariff_inr_per_kwh"
                      value={chargeForm.tariff_inr_per_kwh}
                      onChange={handleChargeChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-[#16a34a] pr-18"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">₹/kWh</span>
                  </div>
                </div>
              </div>

              {chargeError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  {chargeError}
                </div>
              )}

              <button
                type="submit"
                disabled={chargeLoading}
                className="w-full py-3.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {chargeLoading ? (
                  <span>Computing Charging Schedule...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>Calculate Charging Plan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Calculated Smart Charging Outputs */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0f244a] border-b border-slate-200 pb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#16a34a]" />
              <span>Calculated Charging Plan</span>
            </h3>

            {/* Metric 1: Required Energy */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                Required Charging Energy
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0f244a] font-mono">
                  {energyStored.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-[#16a34a] font-mono">kWh Net Stored</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Grid input: <strong className="text-slate-700">{(energyStored / 0.9).toFixed(1)} kWh</strong> (at 90% efficiency)
              </div>
            </div>

            {/* Metric 2: Estimated Time */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Estimated Charging Time
                </span>
                <Clock className="w-4 h-4 text-[#16a34a]" />
              </div>
              <div className="text-2xl font-black text-[#0f244a] font-mono">
                {formattedTime}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                From {chargeForm.current_charge_pct}% to {chargeForm.desired_charge_pct}% on {chargeForm.charger_power_kw} kW charger.
              </div>
            </div>

            {/* Metric 3: Estimated Cost */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Estimated Session Cost
                </span>
                <IndianRupee className="w-4 h-4 text-[#16a34a]" />
              </div>
              <div className="text-2xl font-black text-[#16a34a] font-mono">
                ₹{costInr.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Calculated at flat rate of ₹{chargeForm.tariff_inr_per_kwh}/kWh.
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. FINAL DASHBOARD: Combined Battery & Charging Insights     */}
      {/* ------------------------------------------------------------- */}
      <section id="dashboard-section" className="space-y-6 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">
            Unified Overview
          </span>
          <h2 className="text-3xl font-extrabold text-[#0f244a] tracking-tight">
            Complete Battery &amp; Charging Dashboard
          </h2>
          <p className="text-slate-600 text-sm">
            All AI-powered battery health metrics and charging projections combined.
          </p>
        </div>

        {/* 6 Combined Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">SOC</span>
            <span className="text-xl font-black text-[#0f244a] font-mono">{socVal.toFixed(1)}%</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">State of Charge</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">SOH</span>
            <span className="text-xl font-black text-[#16a34a] font-mono">{sohVal.toFixed(1)}%</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">State of Health</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">RUL</span>
            <span className="text-xl font-black text-[#0f244a] font-mono">{Math.round(rulVal)}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Cycles Remaining</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Energy</span>
            <span className="text-xl font-black text-[#0f244a] font-mono">{energyStored.toFixed(1)}</span>
            <span className="text-[10px] text-slate-500 block mt-1">kWh Required</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Duration</span>
            <span className="text-xl font-black text-[#0f244a] font-mono">{formattedTime}</span>
            <span className="text-[10px] text-slate-500 block mt-1">Est. Time</span>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block">Cost</span>
            <span className="text-xl font-black text-[#16a34a] font-mono">₹{costInr.toFixed(1)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Total INR</span>
          </div>
        </div>

        {/* Real Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          {/* Chart 1: Simulated Charging Progression */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0f244a] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#16a34a]" />
                  <span>Charging Progression Curve</span>
                </h3>
                <p className="text-[11px] text-slate-500">Progression from {startSoc}% to {targetSoc}%</p>
              </div>
              <span className="text-[10px] font-mono text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded font-bold">
                SOC %
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chargingCurveData}>
                  <defs>
                    <linearGradient id="landingSocArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="minute" unit=" min" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} unit="%" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(val) => [`${val}%`, 'State of Charge']}
                  />
                  <Area type="monotone" dataKey="soc" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#landingSocArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Projected Capacity Retention */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0f244a] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                  <span>Projected Cell Capacity Retention (SOH)</span>
                </h3>
                <p className="text-[11px] text-slate-500">SOH % retention trajectory across charging cycles</p>
              </div>
              <span className="text-[10px] font-mono text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded font-bold">
                80% EOL
              </span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={degradationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="cycle" unit=" cyc" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={[75, 100]} unit="%" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    formatter={(val) => [`${val}%`, 'State of Health']}
                  />
                  <Line type="monotone" dataKey="soh" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
