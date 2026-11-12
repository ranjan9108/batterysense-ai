import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Table, 
  Info,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

const DATA_DICTIONARY = [
  { column: 'CC', meaning: 'Constant-current value applied during battery test in Amperes', type: 'Float' },
  { column: 'CH 1/Dis 0', meaning: 'Charge/Discharge mode: 1 = Charging state, 0 = Discharging state', type: 'Integer (Binary)' },
  { column: 'Type of battry', meaning: 'Battery chemistry code: 1 = LFP, 2 = NiCd, 3 = NMC', type: 'Integer (Categorical)' },
  { column: 'C-rate', meaning: 'Normalized charge/discharge current rate relative to 1-hour nominal capacity', type: 'Float' },
  { column: 'Current_Cycle_Number_Input', meaning: 'Cumulative completed full equivalent charge-discharge cycles', type: 'Integer' },
  { column: 'Voltage_1 ... Voltage_255', meaning: 'High-resolution sequential cell voltage measurements logged across session', type: 'Float Series' },
  { column: 'Voltage_Min_V', meaning: 'Minimum terminal cell voltage observed in the cycle profile in Volts', type: 'Float' },
  { column: 'Voltage_Max_V', meaning: 'Maximum terminal cell voltage reached in the cycle profile in Volts', type: 'Float' },
  { column: 'Voltage_Mean_V', meaning: 'Arithmetic mean of cell voltage measurements across cycle profile in Volts', type: 'Float' },
  { column: 'Voltage_Std_V', meaning: 'Standard deviation of voltage measurements reflecting profile curvature', type: 'Float' },
  { column: 'Voltage_Range_V', meaning: 'Difference between maximum and minimum terminal cell voltage (Max - Min)', type: 'Float' },
  { column: 'SOC_Mean_pct', meaning: 'Estimated mean State of Charge percentage for the session', type: 'Target (0-100%)' },
  { column: 'SOH_Estimated_pct', meaning: 'Estimated State of Health percentage relative to nominal 1.0 Ah capacity', type: 'Target (0-100%)' },
  { column: 'RUL_Estimated_Cycles', meaning: 'Remaining Useful Life in equivalent cycles until 80% EOL threshold', type: 'Target (Cycles)' }
];

export default function DatasetView() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyticsSummary();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const records = analytics?.records_preview || [];
  const filteredRecords = records.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header and metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Dataset Integrity &amp; Record Viewer</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Source: <span className="font-mono text-emerald-400 font-semibold">Battery_dataset.xlsx</span> | Sheet: <span className="font-mono text-cyan-400 font-semibold">data</span>
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Dataset</span>
          </button>
        </div>

        {/* Compliance & Safety Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-semibold text-slate-200 block">Original Measurements</span>
              <span className="text-slate-400">Preserved original column names &amp; voltage steps without artificial labels.</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-semibold text-slate-200 block">Data Leakage Guard</span>
              <span className="text-slate-400">Target columns (SOC/SOH/RUL) strictly separated from model training input features.</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <span className="font-semibold text-slate-200 block">Transparent Estimates</span>
              <span className="text-slate-400">Target labels clearly identified as assumption-based estimates on 80 experimental runs.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Primary Dataset Preview ({analytics?.total_records || 80} Records Total, 321 Columns)
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search values in preview..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono w-60"
            />
          </div>
        </div>

        {/* Scrollable Data Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <tr>
                <th className="py-2.5 px-3 font-semibold">#</th>
                <th className="py-2.5 px-3 font-semibold">CC (A)</th>
                <th className="py-2.5 px-3 font-semibold">Mode</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">C-rate</th>
                <th className="py-2.5 px-3 font-semibold">Cycle</th>
                <th className="py-2.5 px-3 font-semibold">V_Min (V)</th>
                <th className="py-2.5 px-3 font-semibold">V_Max (V)</th>
                <th className="py-2.5 px-3 font-semibold">V_Mean (V)</th>
                <th className="py-2.5 px-3 font-semibold">SOC (%)</th>
                <th className="py-2.5 px-3 font-semibold">SOH (%)</th>
                <th className="py-2.5 px-3 font-semibold">RUL (Cycles)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 text-white">{row['CC']}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${row['CH 1/Dis 0'] === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {row['CH 1/Dis 0'] === 1 ? 'Charge' : 'Discharge'}
                      </span>
                    </td>
                    <td className="py-2 px-3">{row['Type of battry'] === 1 ? 'LFP' : (row['Type of battry'] === 2 ? 'NiCd' : 'NMC')}</td>
                    <td className="py-2 px-3">{row['C-rate']}</td>
                    <td className="py-2 px-3 text-cyan-400">{row['Current_Cycle_Number_Input']}</td>
                    <td className="py-2 px-3">{Number(row['Voltage_Min_V']).toFixed(3)}</td>
                    <td className="py-2 px-3">{Number(row['Voltage_Max_V']).toFixed(3)}</td>
                    <td className="py-2 px-3 text-emerald-400">{Number(row['Voltage_Mean_V']).toFixed(3)}</td>
                    <td className="py-2 px-3">{Number(row['SOC_Mean_pct']).toFixed(1)}%</td>
                    <td className="py-2 px-3 text-teal-300">{Number(row['SOH_Estimated_pct']).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-cyan-300">{Math.round(row['RUL_Estimated_Cycles'])}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="py-6 text-center text-slate-500 font-sans">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Dictionary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Feature &amp; Column Definitions Dictionary
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {DATA_DICTIONARY.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-white text-[11px]">{item.column}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {item.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">{item.meaning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
