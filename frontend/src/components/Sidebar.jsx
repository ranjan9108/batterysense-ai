import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Zap,
  Info,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, backendStatus }) {
  const navItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'prediction', label: 'Battery Prediction', icon: Activity },
    { id: 'charging', label: 'Smart Charging', icon: Zap },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              EV Battery AI
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium">Smart Optimizer</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1.5">
          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend connection pill in sidebar footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${backendStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium text-[11px]">
              {backendStatus.online ? 'AI Backend Online' : 'Local Mode'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">CatBoost</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 truncate">
          Models: {backendStatus.modelsLoaded ? 'SOC · SOH · RUL Ready' : 'Loading...'}
        </p>
      </div>
    </aside>
  );
}
