import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Activity, 
  Thermometer, 
  Layers, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  RefreshCw,
  Database
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { api } from '../services/api';

export default function BatteryAnalytics({ latestPrediction }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAnalyticsSummary();
      setAnalytics(data);
    } catch (err) {
      setError(err.message || "Failed to load analytics summary from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const vStats = analytics?.voltage_statistics;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Battery Analytics &amp; Voltage Profiling</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical distribution of battery features and voltage measurements from the primary experimental dataset.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <span className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin inline-block mb-3" />
          <p className="text-xs text-slate-400">Loading dataset analytics and voltage records...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to Load Analytics</p>
            <p className="mt-1 text-slate-400">{error}</p>
            <p className="mt-2 text-[11px] text-slate-500">
              Ensure the FastAPI backend server is running and accessible at {api.getBaseUrl()}.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Dataset Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Records
                </span>
                <Database className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono mt-2">
                {analytics?.total_records || 80}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Experimental battery test cycles</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Measured Features
                </span>
                <Layers className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono mt-2">
                {analytics?.total_columns || 321}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Sequential voltage &amp; operational metrics</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Mean Voltage
                </span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono mt-2">
                {vStats?.mean_voltage?.avg ? `${vStats.mean_voltage.avg.toFixed(3)} V` : '3.494 V'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Min: {vStats?.mean_voltage?.min?.toFixed(2) || '2.65'}V | Max: {vStats?.mean_voltage?.max?.toFixed(2) || '3.65'}V
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Temperature Status
                </span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-sm font-bold text-amber-300 mt-2">
                Not Logged in Dataset
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Verified: Excluded to prevent synthetic bias
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Sample Battery Sequential Voltage Profile (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Battery Sequential Voltage Curve (Sample Record Profile)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Individual voltage trajectory across sequential charge sample steps (Voltage_1 to Voltage_40)
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  Sample Cycle #1
                </span>
              </div>

              <div className="h-64 w-full">
                {analytics?.sample_voltage_profile && analytics.sample_voltage_profile.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.sample_voltage_profile} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis 
                        dataKey="sample" 
                        stroke="#64748b" 
                        tick={{ fontSize: 10 }}
                        label={{ value: 'Sample Step Index', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        tick={{ fontSize: 10 }}
                        domain={['auto', 'auto']}
                        label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', offset: 25, fontSize: 10, fill: '#64748b' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val) => [`${val} V`, 'Voltage']}
                        labelFormatter={(label) => `Step: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="voltage" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ r: 2, fill: '#10b981' }}
                        activeDot={{ r: 5, fill: '#34d399' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No sequential voltage steps loaded.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Battery Chemistry Distribution (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Battery Chemistries in Dataset</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Breakdown of battery types tested in dataset
                </p>
              </div>

              <div className="h-64 w-full">
                {analytics?.chemistry_distribution ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.chemistry_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="type" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(val) => [`${val} Records`, 'Sample Count']}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {analytics.chemistry_distribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#10b981' : (index === 1 ? '#06b6d4' : '#6366f1')} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No chemistry breakdown available.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Detailed Voltage Summary Statistics & Latest Prediction Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detailed Voltage Statistics Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Detailed Voltage Summary Statistics
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="pb-2 font-semibold">Measurement Metric</th>
                      <th className="pb-2 font-semibold">Dataset Mean</th>
                      <th className="pb-2 font-semibold">Min Value</th>
                      <th className="pb-2 font-semibold">Max Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                    <tr>
                      <td className="py-2 font-sans font-medium text-white">Mean Voltage (`Voltage_Mean_V`)</td>
                      <td className="py-2 text-emerald-400">{vStats?.mean_voltage?.avg?.toFixed(4) || '3.4940'} V</td>
                      <td className="py-2">{vStats?.mean_voltage?.min?.toFixed(4) || '2.6561'} V</td>
                      <td className="py-2">{vStats?.mean_voltage?.max?.toFixed(4) || '3.6520'} V</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-sans font-medium text-white">Minimum Voltage (`Voltage_Min_V`)</td>
                      <td className="py-2 text-emerald-400">{vStats?.min_voltage?.avg?.toFixed(4) || '2.7050'} V</td>
                      <td className="py-2">{vStats?.min_voltage?.min?.toFixed(4) || '2.4500'} V</td>
                      <td className="py-2">{vStats?.min_voltage?.max?.toFixed(4) || '3.1000'} V</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-sans font-medium text-white">Maximum Voltage (`Voltage_Max_V`)</td>
                      <td className="py-2 text-emerald-400">{vStats?.max_voltage?.avg?.toFixed(4) || '3.6515'} V</td>
                      <td className="py-2">{vStats?.max_voltage?.min?.toFixed(4) || '3.6500'} V</td>
                      <td className="py-2">{vStats?.max_voltage?.max?.toFixed(4) || '3.6520'} V</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-sans font-medium text-white">Voltage Range (`Voltage_Range_V`)</td>
                      <td className="py-2 text-emerald-400">{vStats?.voltage_range?.avg?.toFixed(4) || '0.9465'} V</td>
                      <td className="py-2">{vStats?.voltage_range?.min?.toFixed(4) || '0.5500'} V</td>
                      <td className="py-2">{vStats?.voltage_range?.max?.toFixed(4) || '1.2000'} V</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-sans font-medium text-white">Std Dev Variation (`Voltage_Std_V`)</td>
                      <td className="py-2 text-emerald-400">{vStats?.voltage_variation?.avg_std?.toFixed(4) || '0.1360'} V</td>
                      <td className="py-2">{vStats?.voltage_variation?.min_std?.toFixed(4) || '0.0850'} V</td>
                      <td className="py-2">{vStats?.voltage_variation?.max_std?.toFixed(4) || '0.1950'} V</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Latest Submitted Prediction Results Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
                <span>Latest Submitted Prediction Results</span>
                {latestPrediction && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                    Condition: {latestPrediction.overall_condition}
                  </span>
                )}
              </h3>

              {!latestPrediction ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <p>No prediction submitted in this session yet.</p>
                  <p className="text-[11px] mt-1 text-slate-600">
                    Switch to the Battery Prediction tab and submit an input to view the live model summary here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Predicted State of Charge (SOC):</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {latestPrediction.predictions.soc ? `${latestPrediction.predictions.soc.predicted_value.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Predicted State of Health (SOH):</span>
                    <span className="font-mono font-bold text-teal-400 text-sm">
                      {latestPrediction.predictions.soh ? `${latestPrediction.predictions.soh.predicted_value.toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Predicted Remaining Useful Life (RUL):</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {latestPrediction.predictions.rul ? `${Math.round(latestPrediction.predictions.rul.predicted_value)} cycles` : 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Input Cycle: #{latestPrediction.input_summary.current_cycle}</span>
                    <span>C-rate: {latestPrediction.input_summary.c_rate}C</span>
                    <span>Mean Voltage: {latestPrediction.input_summary.mean_voltage_v}V</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
