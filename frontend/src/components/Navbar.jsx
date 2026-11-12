import React, { useState } from 'react';
import { 
  Zap, 
  Activity, 
  Calculator, 
  LayoutDashboard, 
  Menu, 
  X, 
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus, onRefreshStatus }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'prediction', label: 'Battery Prediction' },
    { id: 'charging', label: 'Smart Charging' },
    { id: 'dashboard', label: 'Dashboard' }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Brand Logo - Exact BatterySense AI Logo */}
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 focus:outline-none group text-left"
            title="BatterySense AI"
          >
            <img 
              src="/logo.png" 
              alt="BatterySense AI Logo" 
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative py-2 text-sm font-semibold tracking-normal transition-colors ${
                    isActive
                      ? 'text-[#16a34a] font-bold'
                      : 'text-slate-700 hover:text-[#0f244a]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#16a34a] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Status + Professional Get Started Button */}
          <div className="hidden sm:flex items-center gap-4">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-medium cursor-help"
              title={backendStatus?.online ? "CatBoost AI Backend Online" : "Backend offline / local fallback"}
            >
              <span className={`w-2 h-2 rounded-full ${backendStatus?.online ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span className="text-slate-600">AI Online</span>
              <button 
                onClick={onRefreshStatus}
                title="Refresh Status"
                className="text-slate-400 hover:text-slate-600 transition-colors ml-0.5"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            </div>

            <button
              onClick={() => handleNavClick('prediction')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-semibold shadow-sm hover:shadow transition-all group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => handleNavClick('prediction')}
              className="px-3 py-1.5 rounded-lg bg-[#16a34a] text-white text-xs font-semibold"
            >
              Get Started
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-950"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-[#16a34a] font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                {isActive && <span className="w-2 h-2 rounded-full bg-[#16a34a]" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
