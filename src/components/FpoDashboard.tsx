import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, AlertOctagon, CheckCircle2, ShieldAlert, 
  MapPin, Phone, Building2, Snowflake, Factory, Users, Scale, 
  Sparkles, Check, Filter, Search, ArrowRight, Eye, Calendar, RefreshCw
} from 'lucide-react';
import { 
  Buyer, ColdStorage, CropType, DashboardMetrics, FoodProcessor, 
  HarvestReport, MandiPriceFeed, RiskLevel, ActionType 
} from '../types';

interface FpoDashboardProps {
  metrics: DashboardMetrics;
  reports: HarvestReport[];
  buyers: Buyer[];
  coldStorages: ColdStorage[];
  processors: FoodProcessor[];
  mandiPrices: MandiPriceFeed[];
  onVerifyReport: (reportId: string, approvedAction?: ActionType, notes?: string) => Promise<void>;
  onRefresh?: () => void;
}

export const FpoDashboard: React.FC<FpoDashboardProps> = ({
  metrics,
  reports,
  buyers,
  coldStorages,
  processors,
  mandiPrices,
  onVerifyReport,
  onRefresh,
}) => {
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [selectedReportForReview, setSelectedReportForReview] = useState<HarvestReport | null>(null);
  const [agentNotes, setAgentNotes] = useState('');
  const [overrideAction, setOverrideAction] = useState<ActionType>('SELL_NOW');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'verification' | 'spatial_map' | 'reports_table'>('verification');

  // Filter reports
  const filteredReports = reports.filter((r) => {
    if (selectedCropFilter !== 'all' && r.crop !== selectedCropFilter) return false;
    // Check risk level if prediction is available
    return true;
  });

  const pendingVerificationReports = reports.filter(
    (r) => r.status === 'PENDING_AGENT_VERIFICATION'
  );

  const handleVerify = async (reportId: string) => {
    setIsVerifying(true);
    try {
      await onVerifyReport(reportId, overrideAction, agentNotes);
      setSelectedReportForReview(null);
      setAgentNotes('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              FPO Field Agent & Command Center
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Pilot Live
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Real-time post-harvest loss monitoring, spoilage risk mitigation, and human-in-the-loop validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>SDG 12.3: -{metrics.foodLossReductionPercent}% Loss</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Spoilage Prevented */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Food Loss Prevented
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {metrics.spoilagePreventedKg.toLocaleString()} <span className="text-sm font-semibold text-stone-500">kg</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{metrics.foodLossReductionPercent}% of monitored harvest saved</span>
          </div>
        </div>

        {/* Card 2: Farmer Income Saved */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Farmer Income Saved
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <span>₹</span>
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            ₹{metrics.spoilagePreventedValueInr.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
            <span>Direct distress loss avoided</span>
          </div>
        </div>

        {/* Card 3: Pending Verifications */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Agent Verifications
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {pendingVerificationReports.length}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
            <span>High-risk pilot human reviews</span>
          </div>
        </div>

        {/* Card 4: Farmers Assisted */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Farmers Assisted
            </span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 tracking-tight">
            {metrics.farmersAssisted || 3}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-stone-500 font-medium">
            <span>{(metrics.totalHarvestKg / 1000).toFixed(1)} MT monitored</span>
          </div>
        </div>
      </div>

      {/* Live Mandi Ticker */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Live Mandi Price Intelligence (Agmarknet Sync)
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mandiPrices.map((m, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900 capitalize">{m.crop}</span>
                  <span className="text-[10px] text-stone-500">({m.marketName})</span>
                </div>
                <div className="text-sm font-extrabold text-stone-900">
                  ₹{m.modalPrice}/kg
                </div>
              </div>
              <div
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                  m.trend === 'UP'
                    ? 'bg-emerald-100 text-emerald-800'
                    : m.trend === 'DOWN'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {m.trend === 'UP' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : m.trend === 'DOWN' ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>{m.trendPercent > 0 ? `+${m.trendPercent}%` : `${m.trendPercent}%`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'verification'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Agent Verification Queue ({pendingVerificationReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('spatial_map')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'spatial_map'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Regional Agro Network Map</span>
        </button>

        <button
          onClick={() => setActiveTab('reports_table')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'reports_table'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span>All Harvest Inquiries ({reports.length})</span>
        </button>
      </div>

      {/* TAB 1: Human-in-the-Loop Agent Verification */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          {pendingVerificationReports.length === 0 ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-stone-900 text-sm">
                All High-Risk Alerts Verified & Dispatched!
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
                FPO field officers have reviewed and confirmed advisory actions for all reported harvests. New farmer inquiries will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: List of Pending Reports */}
              <div className="lg:col-span-1 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Select Harvest Report to Review
                </div>
                {pendingVerificationReports.map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => {
                      setSelectedReportForReview(rep);
                      setOverrideAction(rep.crop === 'tomato' ? 'SELL_NOW' : 'STORE_AND_WAIT');
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedReportForReview?.id === rep.id
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">
                          {rep.crop === 'tomato' ? '🍅' : rep.crop === 'banana' ? '🍌' : '🥭'}
                        </span>
                        <span className="font-bold text-sm text-stone-900 capitalize">
                          {rep.crop} ({rep.quantityKg} kg)
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        Needs Agent Sign-off
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 font-medium">
                      Farmer: {rep.farmerName} ({rep.locationName})
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Harvested {rep.daysSinceHarvest} days ago • {rep.ambientTempC}°C ambient heat
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Verification Action Panel */}
              <div className="lg:col-span-2">
                {selectedReportForReview ? (
                  <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
                    <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {selectedReportForReview.crop === 'tomato'
                              ? '🍅'
                              : selectedReportForReview.crop === 'banana'
                              ? '🍌'
                              : '🥭'}
                          </span>
                          <div>
                            <h2 className="text-base font-bold text-stone-900">
                              {selectedReportForReview.farmerName}'s {selectedReportForReview.quantityKg} kg{' '}
                              <span className="capitalize">{selectedReportForReview.crop}</span>
                            </h2>
                            <p className="text-xs text-stone-500">
                              {selectedReportForReview.locationName} • Phone:{' '}
                              {selectedReportForReview.farmerPhone}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 font-mono text-stone-600">
                        Report #{selectedReportForReview.id.slice(-6)}
                      </span>
                    </div>

                    {/* Farmer's original message / audio transcript */}
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80">
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Farmer WhatsApp Message / Voice Transcript
                      </div>
                      <p className="text-xs text-stone-800 italic">
                        "{selectedReportForReview.transcript || 'Voice note transcript unavailable'}"
                      </p>
                    </div>

                    {/* Biological & Spoilage Factor Matrix */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                        <div className="text-[10px] font-bold text-amber-800 uppercase">
                          Days Since Harvest
                        </div>
                        <div className="text-lg font-black text-amber-950">
                          {selectedReportForReview.daysSinceHarvest} Days
                        </div>
                        <div className="text-[10px] text-amber-700">
                          Stored in {selectedReportForReview.storageType.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                        <div className="text-[10px] font-bold text-rose-800 uppercase">
                          Ambient Temp
                        </div>
                        <div className="text-lg font-black text-rose-950">
                          {selectedReportForReview.ambientTempC}°C
                        </div>
                        <div className="text-[10px] text-rose-700">
                          High respiration acceleration
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase">
                          Estimated Shelf Life
                        </div>
                        <div className="text-lg font-black text-emerald-950">
                          ~1.4 Days
                        </div>
                        <div className="text-[10px] text-emerald-700">
                          🔴 HIGH SPOILAGE RISK
                        </div>
                      </div>
                    </div>

                    {/* Agent Verification Decision Controls */}
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-stone-700 block">
                        Confirm or Adjust Advisory Action:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { action: 'SELL_NOW', label: 'Sell Today (Mandi Trader)', icon: Phone },
                          { action: 'STORE_AND_WAIT', label: 'Transfer to Cold Storage', icon: Snowflake },
                          { action: 'PROCESS_VALUE_ADD', label: 'Deliver to Food Processor', icon: Factory },
                        ].map((btn) => (
                          <button
                            key={btn.action}
                            type="button"
                            onClick={() => setOverrideAction(btn.action as ActionType)}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                              overrideAction === btn.action
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <btn.icon className="w-4 h-4" />
                            <span>{btn.label}</span>
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          FPO Field Officer Notes (Optional):
                        </label>
                        <input
                          type="text"
                          value={agentNotes}
                          onChange={(e) => setAgentNotes(e.target.value)}
                          placeholder="e.g., Verified truck availability with Nashik Mandi Stall 42; price locked at ₹24/kg."
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => setSelectedReportForReview(null)}
                          className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                        >
                          Cancel
                        </button>

                        <button
                          disabled={isVerifying}
                          onClick={() => handleVerify(selectedReportForReview.id)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>
                            {isVerifying ? 'Verifying & Notifying...' : 'Approve & Dispatch Advice to Farmer'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
                    <ShieldAlert className="w-8 h-8 text-stone-400 mb-2" />
                    <h3 className="font-bold text-sm text-stone-700">Select a Report from the List</h3>
                    <p className="text-xs text-stone-500 max-w-sm mt-1">
                      Choose an inquiry on the left to inspect harvest parameters, adjust routing, and send validated WhatsApp advice.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Regional Agro Network Map (Visual Simulation) */}
      {activeTab === 'spatial_map' && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Spatial Logistics & Facility Network (Maharashtra / Gujarat Agri Corridor)
              </h2>
              <p className="text-xs text-stone-500">
                Visualizing farmers, high-risk flags, cold storage capacity, and processing hubs.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-red-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> High-Risk Harvest
              </span>
              <span className="flex items-center gap-1 text-sky-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Cold Storage
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Food Processor
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Mandi Buyer
              </span>
            </div>
          </div>

          {/* Interactive Geographic Map Canvas Representation */}
          <div className="relative w-full h-[400px] bg-stone-100 rounded-xl overflow-hidden border border-stone-200 p-4">
            {/* Map Background Grid & Stylized Terrain */}
            <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />

            {/* Region Label: Nashik Cluster */}
            <div className="absolute top-10 left-12 p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-stone-200 shadow-xs max-w-xs z-10">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nashik Horticulture Cluster (Maharashtra)</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Tomato & Grape hub • 1,200 kg high-risk harvest active in Ozar
              </div>
              <div className="mt-2 text-[10px] space-y-0.5 text-stone-600 font-mono">
                <div>• Sahyadri Pre-cooling: 120 MT space available</div>
                <div>• Nashik APMC Mandi: ₹24/kg modal spot rate</div>
                <div>• Sahyadri Puree Mill: 25 MT/day capacity</div>
              </div>
            </div>

            {/* Region Label: Jalgaon Cluster */}
            <div className="absolute top-8 right-16 p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-stone-200 shadow-xs max-w-xs z-10">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Jalgaon Banana Cluster (Khandesh)</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Banana Capital • 4,000 kg harvest in Nimbhora
              </div>
              <div className="mt-2 text-[10px] space-y-0.5 text-stone-600 font-mono">
                <div>• MahaFresh CA Cold Store: 340 MT free space</div>
                <div>• Khandesh Chips Mill: buying at ₹16/kg</div>
              </div>
            </div>

            {/* Region Label: Valsad / South Gujarat Cluster */}
            <div className="absolute bottom-10 left-36 p-3 bg-white/90 backdrop-blur-xs rounded-xl border border-stone-200 shadow-xs max-w-xs z-10">
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Valsad & Navsari Belt (Gujarat)</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Kesar & Alphonso Mango zone • 850 kg harvest
              </div>
              <div className="mt-2 text-[10px] space-y-0.5 text-stone-600 font-mono">
                <div>• Desai Pulp Mill: buying at ₹42/kg</div>
                <div>• Gujarat Agro Cold Hub: 95 MT available</div>
              </div>
            </div>

            {/* Spatial Facility Markers */}
            {/* Cold Storages */}
            <div className="absolute top-36 left-44 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
                <Snowflake className="w-4 h-4" />
              </div>
              <div className="hidden group-hover:block absolute bottom-9 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20">
                Sahyadri Cold Chain (120 MT avail)
              </div>
            </div>

            {/* Food Processor */}
            <div className="absolute top-44 left-56 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
                <Factory className="w-4 h-4" />
              </div>
              <div className="hidden group-hover:block absolute bottom-9 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20">
                Sahyadri Puree Mill (₹18/kg)
              </div>
            </div>

            {/* Mandi Trader */}
            <div className="absolute top-32 left-28 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="hidden group-hover:block absolute bottom-9 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20">
                Nashik APMC Mandi Stall 42 (₹24/kg)
              </div>
            </div>

            {/* High-Risk Farmer Marker */}
            <div className="absolute top-28 left-48 group cursor-pointer animate-bounce">
              <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl border-2 border-white">
                <span className="text-xs font-bold">🍅</span>
              </div>
              <div className="hidden group-hover:block absolute bottom-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-md whitespace-nowrap z-20">
                Ramesh Patel (1,200 kg - Urgent Dispatch!)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: All Harvest Reports Table */}
      {activeTab === 'reports_table' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Harvest Inquiries Database
            </h2>
            <span className="text-xs text-stone-500">{reports.length} total entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Crop & Volume</th>
                  <th className="py-3 px-4">Days Elapsed</th>
                  <th className="py-3 px-4">Storage Mode</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900">{r.farmerName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{r.farmerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-bold text-stone-900">{r.crop}</span>
                      <span className="text-stone-500 ml-1">({r.quantityKg.toLocaleString()} kg)</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono">
                        {r.daysSinceHarvest} days
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {r.storageType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {r.locationName}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'VERIFIED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                          <ShieldAlert className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
