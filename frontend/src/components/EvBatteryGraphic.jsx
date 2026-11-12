import React from 'react';
import { Battery } from 'lucide-react';

export default function EvBatteryGraphic({ soc = 80 }) {
  return (
    <div className="w-full flex items-center justify-center p-4">
      <div className="flex items-center gap-2 text-cyan-400">
        <Battery className="w-8 h-8" />
        <span className="text-sm font-bold font-mono">{Math.round(soc)}%</span>
      </div>
    </div>
  );
}
