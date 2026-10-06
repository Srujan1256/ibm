/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sprout, MessageSquare, LayoutDashboard, Sliders, Terminal, 
  Globe2, ShieldCheck, HeartHandshake, RefreshCw 
} from 'lucide-react';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { FpoDashboard } from './components/FpoDashboard';
import { MlSimulatorLab } from './components/MlSimulatorLab';
import { ApiExplorer } from './components/ApiExplorer';
import { 
  CropType, LanguageCode, DashboardMetrics, HarvestReport, 
  Buyer, ColdStorage, FoodProcessor, MandiPriceFeed, ActionType 
} from './types';
import { MANDI_PRICES, SEED_BUYERS, SEED_COLD_STORAGES, SEED_PROCESSORS } from './data/seedData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'fpo' | 'ml_lab' | 'api'>('whatsapp');
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('hi');

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalHarvestKg: 6050,
    totalHarvestValueInr: 133100,
    spoilagePreventedKg: 4200,
    spoilagePreventedValueInr: 102400,
    foodLossReductionPercent: 69.4,
    farmersAssisted: 3,
    highRiskAlertsActive: 2,
    pendingAgentVerifications: 1,
    cropBreakdown: {
      tomato: { totalKg: 1200, savedKg: 1020 },
      banana: { totalKg: 4000, savedKg: 2800 },
      mango: { totalKg: 850, savedKg: 380 },
    },
  });

  const [reports, setReports] = useState<HarvestReport[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>(SEED_BUYERS);
  const [coldStorages, setColdStorages] = useState<ColdStorage[]>(SEED_COLD_STORAGES);
  const [processors, setProcessors] = useState<FoodProcessor[]>(SEED_PROCESSORS);
  const [mandiPrices, setMandiPrices] = useState<MandiPriceFeed[]>(MANDI_PRICES);

  // Fetch initial dashboard state from server
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (data.reports) setReports(data.reports);
        if (data.buyers) setBuyers(data.buyers);
        if (data.coldStorages) setColdStorages(data.coldStorages);
        if (data.processors) setProcessors(data.processors);
      }
    } catch (err) {
      console.warn('Dashboard fetch fallback to seed:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleReportCreated = (newReport: HarvestReport) => {
    setReports((prev) => [newReport, ...prev]);
    fetchDashboardData();
  };

  const handleVerifyReport = async (reportId: string, approvedAction?: ActionType, notes?: string) => {
    try {
      const res = await fetch('/api/agent/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          agentId: 'agent-007',
          approvedAction,
          notes,
        }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: 'VERIFIED' } : r))
        );
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to verify report:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Universal Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-stone-900">
                  HarvestSaver <span className="text-emerald-600">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  SDG 2 & 12.3
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                Saving smallholder harvests before they spoil via WhatsApp & Cold-Chain AI
              </p>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">WhatsApp</span> Advisor
            </button>

            <button
              onClick={() => setActiveTab('fpo')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'fpo'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />
              <span>FPO Command</span>
              {metrics.pendingAgentVerifications > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  {metrics.pendingAgentVerifications}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ml_lab')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ml_lab'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>ML Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'api'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-stone-700" />
              <span className="hidden sm:inline">API</span> Sandbox
            </button>
          </nav>

          {/* Right Language Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs">
              <Globe2 className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value as LanguageCode)}
                className="bg-transparent font-bold text-stone-800 outline-none cursor-pointer"
              >
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'whatsapp' && (
          <WhatsAppSimulator
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            onReportCreated={handleReportCreated}
          />
        )}

        {activeTab === 'fpo' && (
          <FpoDashboard
            metrics={metrics}
            reports={reports}
            buyers={buyers}
            coldStorages={coldStorages}
            processors={processors}
            mandiPrices={mandiPrices}
            onVerifyReport={handleVerifyReport}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeTab === 'ml_lab' && <MlSimulatorLab />}

        {activeTab === 'api' && <ApiExplorer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 px-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">HarvestSaver AI</span>
            <span>•</span>
            <span>Targeting SDG 12.3: 50% Reduction in Global Food Losses along Supply Chains</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Post-Harvest Biological Degradation & Logistic Matchmaking Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
