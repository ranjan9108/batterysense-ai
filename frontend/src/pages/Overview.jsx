import React from 'react';
import {
  Zap,
  Activity,
  Battery,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Info
} from 'lucide-react';
import KpiCard from '../components/KpiCard';

export default function Overview({ 
  latestPrediction, 
  latestCharging, 
  onNavigate, 
  backendStatus 
}) {
  const socVal = latestPrediction?.predictions?.soc?.predicted_value;
  const sohVal = latestPrediction?.predictions?.soh?.predicted_value;
  const rulVal = latestPrediction?.predictions?.rul?.predicted_value;
  const costVal = latestCharging?.results?.estimated_cost_inr;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Driven EV Battery Intelligence</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            AI-Based EV Battery Life Prediction &amp; Smart Charging Optimizer
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            A production-ready engineering dashboard trained on actual EV battery voltage profiles. 
            Delivers machine learning predictions for State of Charge (SOC), State of Health (SOH), 
            Remaining Useful Life (RUL), and precision smart charging optimization for EV fleets and vehicles.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigate('prediction')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Predict Battery Health</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('charging')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Smart Charging Optimizer</span>
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Info className="w-4 h-4" />
              <span>Learn More</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Predicted SOC"
          value={socVal !== undefined ? socVal.toFixed(1) : null}
          unit="%"
          status={latestPrediction?.predictions?.soc?.status || (socVal ? 'Active' : null)}
          description={latestPrediction ? 'Latest model prediction' : 'Run prediction form to calculate'}
          iconType="soc"
          isPlaceholder={socVal === undefined}
        />
        <KpiCard
          title="Predicted SOH"
          value={sohVal !== undefined ? sohVal.toFixed(2) : null}
          unit="%"
          status={latestPrediction?.predictions?.soh?.status || (sohVal ? 'Healthy' : null)}
          description={latestPrediction ? 'State of Health estimate' : 'Run prediction form to calculate'}
          iconType="soh"
          isPlaceholder={sohVal === undefined}
        />
        <KpiCard
          title="Predicted RUL"
          value={rulVal !== undefined ? Math.round(rulVal) : null}
          unit="cycles"
          status={latestPrediction?.predictions?.rul?.status || (rulVal ? 'Nominal' : null)}
          description={latestPrediction ? 'Remaining Useful Cycles' : 'Run prediction form to calculate'}
          iconType="rul"
          isPlaceholder={rulVal === undefined}
        />
        <KpiCard
          title="Estimated Charge Cost"
          value={costVal !== undefined ? `₹${costVal.toFixed(2)}` : null}
          unit=""
          status={latestCharging ? (latestCharging.results.is_feasible ? 'Feasible' : 'Time Constrained') : null}
          description={latestCharging ? `${latestCharging.results.formatted_time} duration` : 'Run smart charging calculator'}
          iconType="cost"
          isPlaceholder={costVal === undefined}
        />
      </div>

      {/* Two Column Grid: Battery Condition Visualizer & Dataset / Pipeline Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Battery Condition Status & Gauge */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Battery className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Live Battery State Visualizer</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {latestPrediction ? `Cycle #${latestPrediction.input_summary.current_cycle}` : 'Awaiting Input Profile'}
            </span>
          </div>

          {/* Graphical Battery Cell Representation */}
          <div className="p-5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Pack Charge Level (SOC):</span>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {socVal !== undefined ? `${socVal.toFixed(1)}%` : '80.0% (Nominal default)'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {socVal !== undefined ? latestPrediction.predictions.soc.status : 'Ready for test input'}
              </span>
            </div>

            {/* Battery bar container */}
            <div className="w-full h-8 bg-slate-900 border-2 border-slate-700 rounded-lg p-1 relative flex items-center">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded transition-all duration-700"
                style={{ width: `${socVal !== undefined ? Math.max(5, Math.min(100, socVal)) : 80}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold text-white drop-shadow">
                  {socVal !== undefined ? `${socVal.toFixed(1)}% Available` : '80.0% Nominal Capacity'}
                </span>
              </div>
            </div>

            {/* SOH progress bar */}
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">Health Capacity Retention (SOH):</span>
              <span className="font-mono font-bold text-teal-400">
                {sohVal !== undefined ? `${sohVal.toFixed(2)}%` : '98.81% Baseline'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${sohVal !== undefined ? Math.max(10, Math.min(100, sohVal)) : 98.8}%` }}
              />
            </div>
          </div>

          {/* Quick status attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
              <p className="text-[11px] text-slate-400 font-medium">Supported Chemistries</p>
              <p className="text-xs font-semibold text-slate-200 mt-1">LFP, NiCd, NMC</p>
              <p className="text-[10px] text-slate-500 mt-0.5">As per dataset classes</p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
              <p className="text-[11px] text-slate-400 font-medium">Degradation Model</p>
              <p className="text-xs font-semibold text-slate-200 mt-1">Multi-Feature Regressor</p>
              <p className="text-[10px] text-slate-500 mt-0.5">CatBoost Regressors only</p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg">
              <p className="text-[11px] text-slate-400 font-medium">Smart Optimizer</p>
              <p className="text-xs font-semibold text-slate-200 mt-1">Two-Phase CC/CV</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Feasibility &amp; Tariff calc</p>
            </div>
          </div>
        </div>

        {/* Right Column: How It Works Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">How It Works</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">CatBoost Machine Learning</p>
                  <p className="text-[11px] text-slate-400">
                    Three dedicated CatBoost Regressors predict SOC, SOH, and RUL from 14 battery operational and voltage features.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Works on Unseen Batteries</p>
                  <p className="text-[11px] text-slate-400">
                    Enter measurements from any battery. The model generalizes to unseen inputs using learned voltage and cycling patterns.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Smart Charging Calculator</p>
                  <p className="text-[11px] text-slate-400">
                    Physics-based formulas compute required energy (kWh), charging time, cost (INR), and schedule feasibility.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Estimates, Not Guarantees</p>
                  <p className="text-[11px] text-slate-400">
                    All predictions are statistical estimates. Actual battery condition may differ based on real-world conditions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-200">Temperature Not Included</p>
                  <p className="text-[11px] text-slate-400">
                    Temperature was not recorded in the training data and is therefore not used as a model input.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('about')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <span>Learn More & Important Limitations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
