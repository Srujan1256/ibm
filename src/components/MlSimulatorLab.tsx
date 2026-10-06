import React, { useState } from 'react';
import { 
  Sliders, Activity, ShieldCheck, AlertTriangle, Thermometer, 
  Droplets, Clock, Package, Eye, Code, FileText, CheckCircle
} from 'lucide-react';
import { CropType, RipenessStage, StorageType } from '../types';
import { calculateSpoilagePrediction } from '../services/spoilageModel';
import { generateRecommendation } from '../services/recommendationEngine';
import { CROP_PROFILES } from '../data/seedData';

export const MlSimulatorLab: React.FC = () => {
  const [crop, setCrop] = useState<CropType>('tomato');
  const [daysSinceHarvest, setDaysSinceHarvest] = useState<number>(3);
  const [ambientTempC, setAmbientTempC] = useState<number>(34);
  const [ambientHumidityPct, setAmbientHumidityPct] = useState<number>(50);
  const [storageType, setStorageType] = useState<StorageType>('ambient_crates');
  const [ripenessStage, setRipenessStage] = useState<RipenessStage>('ripe');
  const [surfaceDamagePct, setSurfaceDamagePct] = useState<number>(5);
  const [quantityKg, setQuantityKg] = useState<number>(1200);

  // Compute live prediction using model
  const prediction = calculateSpoilagePrediction({
    crop,
    daysSinceHarvest,
    ambientTempC,
    ambientHumidityPct,
    storageType,
    ripenessStage,
    surfaceDamagePct,
  });

  const recommendation = generateRecommendation({
    prediction,
    quantityKg,
    farmerLat: 20.098,
    farmerLng: 73.918,
    ripenessStage,
    reportId: 'sim-lab',
  });

  const profile = CROP_PROFILES[crop];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-600" />
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            Post-Harvest Spoilage & Shelf-Life ML Lab
          </h1>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Simulate biological respiration kinetics, Arrhenius temperature decay coefficients, and storage factors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders & Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Input Parameters
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold font-mono">
              Model: v2.1-RandomForest
            </span>
          </div>

          {/* Crop Selector */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              Target Crop Profile:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['tomato', 'banana', 'mango'] as CropType[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCrop(c)}
                  className={`p-2.5 rounded-xl border text-xs font-bold capitalize flex items-center justify-center gap-1.5 transition-all ${
                    crop === c
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{c === 'tomato' ? '🍅' : c === 'banana' ? '🍌' : '🥭'}</span>
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Temperature Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-stone-700 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                Ambient Temperature:
              </span>
              <span className="font-extrabold text-stone-900 font-mono text-sm">
                {ambientTempC}°C
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="45"
              step="1"
              value={ambientTempC}
              onChange={(e) => setAmbientTempC(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
              <span>10°C (Cold Chain)</span>
              <span>25°C (Mild)</span>
              <span>45°C (Extreme Heat)</span>
            </div>
          </div>

          {/* Days Since Harvest Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-stone-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Days Elapsed Since Harvest:
              </span>
              <span className="font-extrabold text-stone-900 font-mono text-sm">
                {daysSinceHarvest} Days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              step="1"
              value={daysSinceHarvest}
              onChange={(e) => setDaysSinceHarvest(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 mt-0.5">
              <span>Day 0 (Harvest today)</span>
              <span>Day 3</span>
              <span>Day 7+</span>
            </div>
          </div>

          {/* Storage Type */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-stone-500" />
              Storage Container / Method:
            </label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value as StorageType)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-medium text-stone-800 outline-none focus:border-emerald-600"
            >
              <option value="ambient_open">Open Piles / Direct Ground (0.75x Baseline)</option>
              <option value="ambient_bags">Gunny / Burlap Bags (Traps heat, 0.85x)</option>
              <option value="ambient_crates">Ventilated Crates in Shade (1.0x Baseline)</option>
              <option value="evaporative_cooler">Zero-Energy Cool Chamber ZECC (1.6x Extension)</option>
              <option value="cold_storage">Controlled Cold Room 10-14°C (3.2x Extension)</option>
            </select>
          </div>

          {/* Ripeness Stage */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-stone-500" />
              Ripeness Stage:
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              {(['unripe', 'breaker_turning', 'ripe', 'overripe'] as RipenessStage[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRipenessStage(st)}
                  className={`py-1.5 px-1 rounded-lg border text-[11px] capitalize transition-all ${
                    ripenessStage === st
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Surface Damage / Blemish % */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-stone-700">Surface Damage / Bruise %:</span>
              <span className="font-extrabold text-stone-900 font-mono text-sm">
                {surfaceDamagePct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={surfaceDamagePct}
              onChange={(e) => setSurfaceDamagePct(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Real-time Model Outputs & Decision Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shelf Life & Risk Meter */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Predicted Shelf Life & Spoilage Classification
              </span>
              <span className="text-xs font-mono font-bold text-stone-600">
                Confidence: {(prediction.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Shelf Life Days */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-center">
                <span className="text-xs text-stone-500 font-medium">Estimated Remaining Life</span>
                <div className="text-4xl font-black text-stone-900 mt-1">
                  {prediction.remainingShelfLifeDays}{' '}
                  <span className="text-lg font-bold text-stone-500">Days</span>
                </div>
                <span className="text-[11px] text-stone-500 mt-1">
                  Baseline under cold chain: {prediction.baselineShelfLifeDays} days
                </span>
              </div>

              {/* Spoilage Risk Badge */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-center ${
                  prediction.riskLevel === 'HIGH'
                    ? 'bg-rose-50 border-rose-200 text-rose-950'
                    : prediction.riskLevel === 'MEDIUM'
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}
              >
                <span className="text-xs font-bold uppercase">Risk Level</span>
                <div className="text-3xl font-black mt-1 flex items-center gap-2">
                  <span>
                    {prediction.riskLevel === 'HIGH'
                      ? '🔴 HIGH'
                      : prediction.riskLevel === 'MEDIUM'
                      ? '🟡 MEDIUM'
                      : '🟢 LOW'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold mt-1">
                  {prediction.riskLevel === 'HIGH'
                    ? 'Urgent liquidation today required'
                    : prediction.riskLevel === 'MEDIUM'
                    ? 'Buffer of 36-48h before softening'
                    : 'Safe firmness and low decay'}
                </span>
              </div>
            </div>

            {/* Biological Degradation Breakdown Table */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Biological Factor Penalties
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-stone-100 border border-stone-200">
                  <div className="text-[10px] text-stone-500">Days Elapsed</div>
                  <div className="font-extrabold text-stone-900 font-mono">
                    -{prediction.factors.daysElapsedImpactDays}d
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <div className="text-[10px] text-rose-700">Temp Decay (Q10)</div>
                  <div className="font-extrabold text-rose-900 font-mono">
                    -{prediction.factors.tempImpactDays}d
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="text-[10px] text-amber-700">Blemish Rot</div>
                  <div className="font-extrabold text-amber-900 font-mono">
                    -{prediction.factors.damageImpactDays}d
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] text-emerald-700">Storage Offset</div>
                  <div className="font-extrabold text-emerald-900 font-mono">
                    {prediction.factors.storageImpactDays > 0 ? `+${prediction.factors.storageImpactDays}` : `${prediction.factors.storageImpactDays}`}d
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Recommendation Card */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Triggered Recommendation Engine Rule
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-stone-900 text-white font-mono font-bold">
                {recommendation.action}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <h4 className="text-sm font-bold text-stone-900">
                {recommendation.title.en}
              </h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {recommendation.reason.en}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-medium">Estimated Revenue</span>
                <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                  ₹{recommendation.estimatedTotalEarningsInr.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-700">
                  @ ₹{recommendation.estimatedPricePerKg}/kg for {quantityKg} kg
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-800 font-medium">Food Loss Avoided</span>
                <div className="text-lg font-black text-amber-950 font-mono mt-0.5">
                  ₹{recommendation.potentialLossAvoidedInr.toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-amber-700">
                  SDG 12.3 direct contribution
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
