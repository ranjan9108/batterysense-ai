import React from 'react';
import { 
  Zap, 
  Activity, 
  Gauge, 
  ShieldCheck, 
  Clock, 
  IndianRupee, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Printer, 
  RefreshCw 
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

export default function DashboardView({ 
  latestPrediction, 
  latestCharging, 
  onNavigate,
  backendStatus 
}) {
  const socData = latestPrediction?.predictions?.soc;
  const sohData = latestPrediction?.predictions?.soh;
  const rulData = latestPrediction?.predictions?.rul;
  const chargingResults = latestCharging?.results;
  const chargingInputs = latestCharging?.inputs;

  const hasPrediction = !!socData && socData.predicted_value !== undefined;
  const hasCharging = !!chargingResults && chargingResults.energy_stored_kwh !== undefined;

  const socVal = hasPrediction ? socData.predicted_value : null;
  const sohVal = hasPrediction ? sohData.predicted_value : null;
  const rulVal = hasPrediction ? rulData.predicted_value : null;

  const energyStored = hasCharging ? chargingResults.energy_stored_kwh : null;
  const gridEnergy = hasCharging ? chargingResults.energy_grid_consumed_kwh : null;
  const formattedTime = hasCharging ? chargingResults.formatted_time : null;
  const totalHours = hasCharging ? chargingResults.estimated_time_hours : null;
  const costInr = hasCharging ? chargingResults.estimated_cost_inr : null;
  const cycleCount = latestPrediction?.input_summary?.current_cycle;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hasPrediction 
    ? circumference - (socVal / 100) * circumference 
    : circumference;

  const startSoc = chargingInputs?.current_soc_pct || 20;
  const targetSoc = chargingInputs?.desired_soc_pct || 80;
  const chargingCurveData = hasCharging ? [
    { minute: 0, soc: startSoc },
    { minute: Math.round((totalHours * 60) * 0.25), soc: Math.round(startSoc + (targetSoc - startSoc) * 0.35) },
    { minute: Math.round((totalHours * 60) * 0.50), soc: Math.round(startSoc + (targetSoc - startSoc) * 0.70) },
    { minute: Math.round((totalHours * 60) * 0.75), soc: Math.round(startSoc + (targetSoc - startSoc) * 0.90) },
    { minute: Math.round(totalHours * 60), soc: targetSoc }
  ] : [];

  const degradationData = hasPrediction ? [
    { cycle: 0, soh: 100 },
    { cycle: Math.round(cycleCount), soh: +(sohVal).toFixed(2) },
    { cycle: Math.round(cycleCount + (rulVal) * 0.33), soh: +(Math.max(80, sohVal - (sohVal - 80) * 0.33)).toFixed(2) },
    { cycle: Math.round(cycleCount + (rulVal) * 0.66), soh: +(Math.max(80, sohVal - (sohVal - 80) * 0.66)).toFixed(2) },
    { cycle: Math.round(cycleCount + rulVal), soh: 80.0 }
  ] : [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Branding */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#16a34a]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-[#0f244a] tracking-tight">
              BatterySense AI Dashboard
            </h1>
          </div>

        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-2 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={() => onNavigate('prediction')}
            className="px-3.5 py-2 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Prediction</span>
          </button>
        </div>
      </div>

{/* CORE 6 METRICS CARDS */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#16a34a]" />
          <span>Core Battery &amp; Charging Metrics</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Predicted SOC with Circular Progress Indicator */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-[#16a34a]" />
                <span>Predicted State of Charge</span>
              </span>
              <span className="text-[10px] font-mono text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded font-bold">
                SOC
              </span>
            </div>

            {hasPrediction ? (
              <div className="flex items-center justify-between my-2">
                <div>
                  <div className="text-3xl font-black text-[#0f244a] font-mono">
                    {socVal.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-[#16a34a] font-semibold mt-1">
                    {socVal >= 20 ? 'Optimal Charge' : 'Low Charge Alert'}
                  </div>
                </div>

                <div className="relative w-18 h-18 flex items-center justify-center">
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
                    {Math.round(socVal)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="my-4 text-center py-2">
                <div className="text-xs text-slate-500">Prediction not yet generated</div>
                <button
                  onClick={() => onNavigate('prediction')}
                  className="mt-2 text-xs text-[#16a34a] hover:text-[#15803d] font-semibold underline"
                >
                  Predict Battery Health &rarr;
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Immediate usable electrical charge percentage.
            </div>
          </div>

          {/* 2. Predicted SOH with Battery Health Indicator */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                <span>Predicted State of Health</span>
              </span>
              <span className="text-[10px] font-mono text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded font-bold">
                SOH
              </span>
            </div>

            {hasPrediction ? (
              <div className="my-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black text-[#16a34a] font-mono">
                    {sohVal.toFixed(2)}%
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {sohVal >= 90 ? 'Grade A' : (sohVal >= 80 ? 'Grade B' : 'Degraded')}
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden my-2.5">
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, sohVal))}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="my-4 text-center py-2">
                <div className="text-xs text-slate-500">Prediction not yet generated</div>
                <button
                  onClick={() => onNavigate('prediction')}
                  className="mt-2 text-xs text-[#16a34a] hover:text-[#15803d] font-semibold underline"
                >
                  Predict Battery Health &rarr;
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Capacity Retention:</span>
              <span className="font-mono text-[#0f244a] font-bold">
                {hasPrediction ? `${sohVal.toFixed(2)}%` : '--'}
              </span>
            </div>
          </div>

          {/* 3. Predicted RUL with Cycles Unit */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#16a34a]" />
                <span>Predicted Remaining Life</span>
              </span>
              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold">
                RUL
              </span>
            </div>

            {hasPrediction ? (
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0f244a] font-mono">
                    {Math.round(rulVal)}
                  </span>
                  <span className="text-xs font-bold text-[#16a34a] uppercase font-mono">
                    Cycles
                  </span>
                </div>

              </div>
            ) : (
              <div className="my-4 text-center py-2">
                <div className="text-xs text-slate-500">Prediction not yet generated</div>
                <button
                  onClick={() => onNavigate('prediction')}
                  className="mt-2 text-xs text-[#16a34a] hover:text-[#15803d] font-semibold underline"
                >
                  Predict Battery Health &rarr;
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Unit: full equivalent charge-discharge cycles.
            </div>
          </div>

          {/* 4. Required Charging Energy */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#16a34a]" />
                <span>Required Charging Energy</span>
              </span>
              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold">
                ENERGY
              </span>
            </div>

            {hasCharging ? (
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#0f244a] font-mono">
                    {energyStored}
                  </span>
                  <span className="text-xs font-bold text-[#16a34a] font-mono">kWh Net</span>
                </div>

              </div>
            ) : (
              <div className="my-4 text-center py-2">
                <div className="text-xs text-slate-500">No charging session calculated</div>
                <button
                  onClick={() => onNavigate('charging')}
                  className="mt-2 text-xs text-[#16a34a] hover:text-[#15803d] font-semibold underline"
                >
                  Calculate Smart Charging &rarr;
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Net electrical energy stored into the pack.
            </div>
          </div>

          {/* 5. Estimated Charging Time */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#16a34a]" />
                <span>Estimated Charging Time</span>
              </span>
              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold">
                TIME
              </span>
            </div>

            {hasCharging ? (
              <div className="my-2">
                <div className="text-3xl font-black text-[#0f244a] font-mono">
                  {formattedTime}
                </div>

              </div>
            ) : (
              <div className="my-4 text-center py-2">
                <div className="text-xs text-slate-500">No charging session calculated</div>
                <button
                  onClick={() => onNavigate('charging')}
                  className="mt-2 text-xs text-[#16a34a] hover:text-[#15803d] font-semibold underline"
                >
                  Calculate Smart Charging &rarr;
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Constant Current &amp; absorption phases.
            </div>
          </div>

          {/* 6. Estimated Charging Cost */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-[#16a34a]" />
                <span>Estimated Charging Cost</span>
              </span>
              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-bold">
                COST
              </span>
            </div>

            {hasCharging ? (
              <div className="my-2">
                <div className="text-3xl font-black text-[#16a34a] font-mono">
                  ₹{costInr.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  At local electricity tariff rate
                </div>
              </div>
            ) : (
              <div className="my-4 text-center py-2">
                <div className="text-xs text-slate-500">No charging session calculated</div>
                <button
                  onClick={() => onNavigate('charging')}
                  className="mt-2 text-xs text-[#16a34a] hover:text-[#15803d] font-semibold underline"
                >
                  Calculate Smart Charging &rarr;
                </button>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
              Total session electricity cost in INR.
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      {(hasCharging || hasPrediction) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hasCharging && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f244a] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#16a34a]" />
                    <span>Calculated Charging Progression</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">State of charge progression from {startSoc}% to {targetSoc}%</p>
                </div>
                <span className="text-[10px] font-mono text-[#16a34a] bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  SOC %
                </span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chargingCurveData}>
                    <defs>
                      <linearGradient id="dashSocAreaLight" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="soc" stroke="#16a34a" strokeWidth={2.5} fillOpacity={1} fill="url(#dashSocAreaLight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hasPrediction && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0f244a] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                    <span>Predicted Capacity Retention Trajectory (SOH)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Estimated SOH % retention over future charge-discharge cycles</p>
                </div>

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
          )}
        </div>
      )}

      {/* Guidance Callout when nothing is computed yet */}
      {!hasPrediction && !hasCharging && (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#16a34a] mx-auto flex items-center justify-center">
            <Activity className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-[#0f244a]">Your Battery Dashboard is Ready</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No predictions or charging sessions have been run in this session yet. To populate your dashboard with authentic AI metrics, choose an option below:
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('prediction')}
              className="px-5 py-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Predict Battery Health</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('charging')}
              className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-[#16a34a]" />
              <span>Calculate Smart Charging</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
