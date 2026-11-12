import React from 'react';
import {
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  AlertCircle,
  Info,
  BookOpen,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Battery,
  BarChart3
} from 'lucide-react';

const FEATURES = [
  {
    icon: Activity,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'State of Charge (SOC) Prediction',
    desc: 'Estimates the current available energy as a percentage of full capacity using real-time voltage and operational measurements.'
  },
  {
    icon: Battery,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    title: 'State of Health (SOH) Prediction',
    desc: 'Assesses how much of the original battery capacity is retained after multiple charge-discharge cycles, indicating aging and degradation.'
  },
  {
    icon: BarChart3,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    title: 'Remaining Useful Life (RUL) Prediction',
    desc: 'Forecasts how many full charge-discharge cycles remain before the battery reaches end-of-life (typically 80% of original capacity).'
  },
  {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    title: 'Smart Charging Optimizer',
    desc: 'Calculates required energy in kWh, estimated duration, charging cost in INR, and checks feasibility within your available time window.'
  }
];

const TECH_STACK = [
  { label: 'ML Framework', value: 'CatBoost Regressor' },
  { label: 'Input Features', value: '14 Battery Operational Parameters' },
  { label: 'Frontend', value: 'React + Vite' },
  { label: 'Backend', value: 'Python FastAPI' },
  { label: 'Models Saved', value: 'Joblib (.joblib)' },
  { label: 'Target Variables', value: 'SOC, SOH, RUL' }
];

const LIMITATIONS = [
  'SOH and RUL target labels are derived from assumption-based proxy calculations, not destructive cell teardown measurements.',
  'Battery temperature was not recorded in the experimental dataset and is therefore excluded from the prediction model.',
  'Predictions represent statistical estimates from training data patterns and may not reflect exact physical conditions.',
  'The smart charging optimizer uses mathematical modeling; it does not claim to minimize degradation without electrochemical validation.',
  'Results from new or unseen batteries may have higher uncertainty if their operational profile differs from the training distribution.'
];

export default function About({ onNavigate }) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Final Year Engineering Project</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            AI-Based EV Battery Life Prediction
            <span className="block text-emerald-400 mt-1">& Smart Charging Optimizer</span>
          </h1>
          <p className="text-slate-300 text-sm mt-4 leading-relaxed max-w-2xl">
            This project applies machine learning to predict electric vehicle battery health and optimize charging
            decisions. It is designed to accept real-world battery measurements and return estimates for SOC, SOH, and
            RUL using a trained CatBoost model, alongside a physics-based smart charging calculator.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => onNavigate('prediction')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Try Battery Prediction</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('charging')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Smart Charging Calculator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Four Main Features */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          What This Tool Does
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className={`p-5 rounded-xl border ${f.border} bg-slate-900 space-y-3`}>
                <div className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          How the Machine Learning Works
        </h2>
        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The prediction engine uses <strong className="text-white">CatBoost Regressors</strong> — a gradient
            boosting algorithm optimized for tabular data. Three separate models are trained, each predicting one
            battery health target (SOC, SOH, RUL) from 14 operational input features.
          </p>
          <p>
            Input features include electrical measurements such as constant current (CC), C-rate, charge/discharge
            state, cycle count, and voltage profile statistics (minimum, maximum, mean, standard deviation, median,
            range, start voltage, end voltage, and coefficient of variation).
          </p>
          <p>
            The models are trained once and saved. When you submit battery measurements through the prediction form,
            the values are sent to the backend, processed in the exact feature order the model was trained on, and
            predictions are returned without retraining.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {TECH_STACK.map((item, idx) => (
            <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
              <p className="text-xs font-bold text-slate-200 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations & Transparency */}
      <div className="bg-amber-950/20 border border-amber-500/25 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Important Limitations & Transparency
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          All predictions are <strong className="text-amber-300">estimates</strong>. Actual battery condition may
          differ due to factors not captured in the model. Please read the following important limitations before
          relying on any prediction for critical decisions.
        </p>
        <ul className="space-y-2.5">
          {LIMITATIONS.map((lim, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* How to Use */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          How to Use This Website
        </h2>
        <div className="space-y-3">
          {[
            {
              step: '1',
              color: 'bg-emerald-500',
              title: 'Go to Battery Prediction',
              desc: 'Enter your battery\'s voltage measurements (minimum, maximum, mean, standard deviation, median, start, end), constant current, C-rate, charge/discharge mode, battery chemistry type, and the current cycle number.'
            },
            {
              step: '2',
              color: 'bg-teal-500',
              title: 'Run the Prediction',
              desc: 'Click "Predict Battery Health". The system sends your inputs to the CatBoost model backend and returns SOC, SOH, and RUL estimates in seconds.'
            },
            {
              step: '3',
              color: 'bg-cyan-500',
              title: 'Optimize Your Charging',
              desc: 'Navigate to Smart Charging. Enter your current SOC, desired SOC, battery capacity, charger power, electricity tariff, efficiency, and available time to get a full charging plan.'
            },
            {
              step: '4',
              color: 'bg-amber-500',
              title: 'Review Results with Caution',
              desc: 'Results are estimates. Use them as a guide, not as a replacement for manufacturer specifications or professional battery diagnostics.'
            }
          ].map((s, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <span className={`w-6 h-6 rounded-full ${s.color} text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5`}>
                {s.step}
              </span>
              <div>
                <p className="text-xs font-bold text-white">{s.title}</p>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer footer card */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          This tool is developed as a final-year academic engineering project. It is intended for demonstration and
          educational purposes. Predictions are generated by machine learning models trained on experimental
          laboratory battery data. Do not use these predictions as the sole basis for safety-critical decisions
          involving battery systems.
        </p>
      </div>

    </div>
  );
}
