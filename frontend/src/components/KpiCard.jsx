import React from 'react';
import { BatteryCharging, HeartPulse, Hourglass, IndianRupee } from 'lucide-react';

export default function KpiCard({ title, value, unit, status, description, iconType, isPlaceholder }) {
  const getIcon = () => {
    switch (iconType) {
      case 'soc':
        return <BatteryCharging className="w-5 h-5 text-emerald-400" />;
      case 'soh':
        return <HeartPulse className="w-5 h-5 text-teal-400" />;
      case 'rul':
        return <Hourglass className="w-5 h-5 text-cyan-400" />;
      case 'cost':
        return <IndianRupee className="w-5 h-5 text-amber-400" />;
      default:
        return <BatteryCharging className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBorderColor = () => {
    switch (iconType) {
      case 'soc':
        return 'border-emerald-500/20 hover:border-emerald-500/40';
      case 'soh':
        return 'border-teal-500/20 hover:border-teal-500/40';
      case 'rul':
        return 'border-cyan-500/20 hover:border-cyan-500/40';
      case 'cost':
        return 'border-amber-500/20 hover:border-amber-500/40';
      default:
        return 'border-slate-800';
    }
  };

  return (
    <div className={`bg-slate-900/90 border ${getBorderColor()} rounded-xl p-5 shadow-lg transition-all flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 mt-2">
            {isPlaceholder ? (
              <span className="text-xl font-medium text-slate-500 font-mono">--</span>
            ) : (
              <>
                <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono">
                  {value}
                </span>
                {unit && <span className="text-sm font-semibold text-emerald-400">{unit}</span>}
              </>
            )}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
          {getIcon()}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
          {description}
        </span>
        {status && (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
