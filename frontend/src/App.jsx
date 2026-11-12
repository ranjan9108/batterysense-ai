import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import BatteryPrediction from './pages/BatteryPrediction';
import SmartCharging from './pages/SmartCharging';
import DashboardView from './pages/DashboardView';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  // Shared state: latest prediction & charging optimization results
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [latestCharging, setLatestCharging] = useState(null);

  // Backend connection status
  const [backendStatus, setBackendStatus] = useState({
    online: false,
    checking: true,
    modelsLoaded: false,
    details: null
  });

  const checkConnection = async () => {
    try {
      const health = await api.checkHealth();
      setBackendStatus({
        online: health.status === 'online',
        checking: false,
        modelsLoaded: health.models_loaded?.soc && health.models_loaded?.soh && health.models_loaded?.rul,
        details: health
      });
    } catch (err) {
      setBackendStatus({
        online: false,
        checking: false,
        modelsLoaded: false,
        details: null
      });
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 20000);
    return () => clearInterval(interval);
  }, []);

  const navigate = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <LandingPage
            onNavigate={navigate}
            latestPrediction={latestPrediction}
            latestCharging={latestCharging}
            onPredictionSuccess={(result) => setLatestPrediction(result)}
            onChargingOptimized={(result) => setLatestCharging(result)}
          />
        );
      case 'prediction':
        return (
          <BatteryPrediction
            onPredictionSuccess={(result) => setLatestPrediction(result)}
            lastPrediction={latestPrediction}
            onNavigate={navigate}
          />
        );
      case 'charging':
        return (
          <SmartCharging
            onChargingOptimized={(result) => setLatestCharging(result)}
            lastChargingResult={latestCharging}
            latestPrediction={latestPrediction}
            onNavigate={navigate}
          />
        );
      case 'dashboard':
        return (
          <DashboardView
            latestPrediction={latestPrediction}
            latestCharging={latestCharging}
            onNavigate={navigate}
            backendStatus={backendStatus}
          />
        );
      default:
        return (
          <LandingPage
            onNavigate={navigate}
            latestPrediction={latestPrediction}
            latestCharging={latestCharging}
            onPredictionSuccess={(result) => setLatestPrediction(result)}
            onChargingOptimized={(result) => setLatestCharging(result)}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Professional Navigation Bar with Home, Battery Prediction, Smart Charging, Dashboard */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={navigate}
        backendStatus={backendStatus}
        onRefreshStatus={checkConnection}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {renderActivePage()}
      </main>

      {/* Modern Minimalistic Clean Enterprise Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-6 mt-16 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0f244a]">BatterySense AI</span>
            <span>&bull;</span>
            <span>Understand Your Battery. Predict Its Life. Charge Smarter.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>CatBoost ML Engine</span>
            <span>&bull;</span>
            <span>FastAPI Backend</span>
            <span>&bull;</span>
            <span className="text-[#16a34a] font-semibold">Production Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
