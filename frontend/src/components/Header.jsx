import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function Header({ activeTab, backendStatus, onRefreshStatus }) {
  const titles = {
    overview: {
      title: 'Home',
      subtitle: 'AI-Based EV Battery Life Prediction & Smart Charging Optimizer'
    },
    prediction: {
      title: 'Battery Health Prediction',
      subtitle: 'Enter battery measurements to predict State of Charge, State of Health, and Remaining Useful Life'
    },
    charging: {
      title: 'Smart Charging Optimizer',
      subtitle: 'Estimate energy requirements, charging duration, cost in INR, and schedule feasibility'
    },
    about: {
      title: 'About This Project',
      subtitle: 'How the AI models work, what they predict, and important limitations to be aware of'
    }
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20">
      <div>
        <h2 className="text-lg font-bold text-white">{current.title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          {backendStatus.online ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-slate-300 font-mono text-[11px]">
            {backendStatus.online ? 'AI Backend Connected' : 'Offline — Local Mode'}
          </span>
          <button
            onClick={onRefreshStatus}
            title="Refresh connection status"
            className="text-slate-400 hover:text-slate-200 transition-colors p-0.5"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
}
