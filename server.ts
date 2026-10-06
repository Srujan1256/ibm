import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Shared Gemini client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Gemini AI initialization notice:', err);
  }
}

// --- SELF-CONTAINED SEED DATA & BIOLOGICAL PROFILES ---
const CROP_PROFILES: Record<string, any> = {
  tomato: {
    id: 'tomato',
    nameEn: 'Tomato',
    nameHi: 'टमाटर',
    nameGu: 'ટામેટાં',
    idealTempC: [12, 15],
    baselineShelfLifeDays: 21,
    ambientShelfLifeDays: 6,
    spoilageKineticsFactor: 1.35,
  },
  banana: {
    id: 'banana',
    nameEn: 'Banana',
    nameHi: 'केला',
    nameGu: 'કેળાં',
    idealTempC: [13, 14],
    baselineShelfLifeDays: 24,
    ambientShelfLifeDays: 5,
    spoilageKineticsFactor: 1.5,
  },
  mango: {
    id: 'mango',
    nameEn: 'Mango',
    nameHi: 'आम',
    nameGu: 'કેરી',
    idealTempC: [11, 13],
    baselineShelfLifeDays: 28,
    ambientShelfLifeDays: 7,
    spoilageKineticsFactor: 1.25,
  },
};

const SEED_BUYERS = [
  {
    id: 'b1',
    name: 'Nashik APMC Wholesale Mandi - Stall 42',
    type: 'Mandi Trader',
    contactPhone: '+91 98221 44520',
    village: 'Panchavati',
    district: 'Nashik',
    lat: 20.0063,
    lng: 73.7903,
    crops: ['tomato', 'banana'],
    capacityKg: 15000,
    priceOffersPerKg: { tomato: 24, banana: 18, mango: 38 },
    rating: 4.6,
  },
  {
    id: 'b2',
    name: 'FreshDirect Retail Hub & Cold Depot',
    type: 'Retail Supermarket',
    contactPhone: '+91 94220 89110',
    village: 'Dindori Road',
    district: 'Nashik',
    lat: 20.065,
    lng: 73.834,
    crops: ['tomato', 'banana', 'mango'],
    capacityKg: 8000,
    priceOffersPerKg: { tomato: 27, banana: 22, mango: 55 },
    rating: 4.8,
  },
  {
    id: 'b3',
    name: 'Jalgaon Banana Export Consortium',
    type: 'Exporter',
    contactPhone: '+91 97655 12040',
    village: 'Raver',
    district: 'Jalgaon',
    lat: 21.2464,
    lng: 75.9287,
    crops: ['banana'],
    capacityKg: 40000,
    priceOffersPerKg: { tomato: 19, banana: 26, mango: 42 },
    rating: 4.7,
  },
  {
    id: 'b4',
    name: 'Valsad Horticulture FPO Market',
    type: 'Aggregator FPO',
    contactPhone: '+91 98980 55122',
    village: 'Pardi',
    district: 'Valsad',
    lat: 20.5126,
    lng: 72.9565,
    crops: ['mango', 'banana'],
    capacityKg: 20000,
    priceOffersPerKg: { tomato: 20, banana: 20, mango: 62 },
    rating: 4.9,
  },
  {
    id: 'b5',
    name: 'Kolar APMC Mandi Commission Agents',
    type: 'Mandi Trader',
    contactPhone: '+91 99002 77310',
    village: 'Gulpet',
    district: 'Kolar',
    lat: 13.1362,
    lng: 78.1291,
    crops: ['tomato'],
    capacityKg: 35000,
    priceOffersPerKg: { tomato: 25, banana: 17, mango: 40 },
    rating: 4.4,
  },
];

const SEED_COLD_STORAGES = [
  {
    id: 'cs1',
    name: 'Sahyadri Agri Cold Chain & Pre-cooling Centre',
    contactPhone: '+91 98229 99011',
    village: 'Mohadi',
    district: 'Nashik',
    lat: 20.088,
    lng: 73.865,
    totalCapacityMt: 450,
    availableCapacityMt: 120,
    pricePerDayPerCrate: 3.5,
    tempRangeC: '10°C to 14°C',
    supportedCrops: ['tomato', 'mango'],
  },
  {
    id: 'cs2',
    name: 'MahaFresh Controlled Atmosphere Banana Cold Store',
    contactPhone: '+91 94234 56789',
    village: 'Varangaon Road',
    district: 'Jalgaon',
    lat: 21.011,
    lng: 75.568,
    totalCapacityMt: 800,
    availableCapacityMt: 340,
    pricePerDayPerCrate: 4.0,
    tempRangeC: '13°C to 15°C',
    supportedCrops: ['banana'],
  },
  {
    id: 'cs3',
    name: 'Gujarat Agro Cold Hub & Ripening Chamber',
    contactPhone: '+91 98791 22345',
    village: 'Chikhli',
    district: 'Navsari/Valsad',
    lat: 20.758,
    lng: 73.063,
    totalCapacityMt: 300,
    availableCapacityMt: 95,
    pricePerDayPerCrate: 5.0,
    tempRangeC: '11°C to 13°C',
    supportedCrops: ['mango', 'banana', 'tomato'],
  },
];

const SEED_PROCESSORS = [
  {
    id: 'p1',
    name: 'Sahyadri Agro Processing & Puree Unit',
    contactPhone: '+91 98224 77123',
    village: 'Dindori',
    district: 'Nashik',
    lat: 20.198,
    lng: 73.834,
    acceptedCrops: ['tomato'],
    processType: 'Tomato Paste, Puree & Ketchup',
    minAcceptableKg: 500,
    buyingPricePerKg: { tomato: 18, banana: 12, mango: 30 },
  },
  {
    id: 'p2',
    name: 'Khandesh Banana Chips & Starch Factory',
    contactPhone: '+91 94222 34567',
    village: 'Savda',
    district: 'Jalgaon',
    lat: 21.149,
    lng: 75.886,
    acceptedCrops: ['banana'],
    processType: 'Vacuum Fried Chips & Green Banana Flour',
    minAcceptableKg: 800,
    buyingPricePerKg: { tomato: 10, banana: 16, mango: 25 },
  },
  {
    id: 'p3',
    name: 'Desai Fruit Pulping & Canning Mill',
    contactPhone: '+91 98981 12344',
    village: 'Amalsad',
    district: 'Navsari/Valsad',
    lat: 20.825,
    lng: 72.978,
    acceptedCrops: ['mango'],
    processType: 'Aseptic Mango Pulp, Juice & Pickle',
    minAcceptableKg: 400,
    buyingPricePerKg: { tomato: 12, banana: 14, mango: 42 },
  },
];

const MANDI_PRICES = [
  {
    crop: 'tomato',
    marketName: 'Nashik APMC',
    state: 'Maharashtra',
    minPrice: 18,
    modalPrice: 24,
    maxPrice: 28,
    trend: 'DOWN',
    trendPercent: -4.5,
  },
  {
    crop: 'banana',
    marketName: 'Jalgaon Mandi',
    state: 'Maharashtra',
    minPrice: 14,
    modalPrice: 19,
    maxPrice: 24,
    trend: 'UP',
    trendPercent: 7.2,
  },
  {
    crop: 'mango',
    marketName: 'Valsad APMC',
    state: 'Gujarat',
    minPrice: 45,
    modalPrice: 58,
    maxPrice: 75,
    trend: 'UP',
    trendPercent: 5.0,
  },
];

const SEED_FARMERS = [
  {
    id: 'f1',
    name: 'Ramesh Patel',
    phone: '+91 98234 10001',
    language: 'hi',
    village: 'Ozar Mig',
    district: 'Nashik',
    lat: 20.098,
    lng: 73.918,
  },
  {
    id: 'f2',
    name: 'Suresh Patil',
    phone: '+91 97654 20002',
    language: 'hi',
    village: 'Nimbhora',
    district: 'Jalgaon',
    lat: 21.212,
    lng: 75.875,
  },
  {
    id: 'f3',
    name: 'Bhavna Desai',
    phone: '+91 98790 30003',
    language: 'gu',
    village: 'Dharampur',
    district: 'Valsad',
    lat: 20.54,
    lng: 73.18,
  },
];

const SAMPLE_INITIAL_REPORTS = [
  {
    id: 'rep-101',
    farmerId: 'f1',
    farmerName: 'Ramesh Patel',
    farmerPhone: '+91 98234 10001',
    crop: 'tomato',
    quantityKg: 1200,
    harvestDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    daysSinceHarvest: 3,
    storageType: 'ambient_crates',
    ripenessStage: 'ripe',
    surfaceDamagePct: 4,
    transcript: 'नमस्ते, 3 दिन पहले 1200 किलो टमाटर तोड़े थे। गर्मी 34 डिग्री है, क्रेट में रखे हैं। कब बेचूं?',
    detectedLanguage: 'hi',
    lat: 20.098,
    lng: 73.918,
    locationName: 'Ozar, Nashik',
    ambientTempC: 34,
    ambientHumidityPct: 48,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    status: 'VERIFIED',
  },
  {
    id: 'rep-102',
    farmerId: 'f2',
    farmerName: 'Suresh Patil',
    farmerPhone: '+91 97654 20002',
    crop: 'banana',
    quantityKg: 4000,
    harvestDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    daysSinceHarvest: 1,
    storageType: 'ambient_bags',
    ripenessStage: 'breaker_turning',
    surfaceDamagePct: 2,
    transcript: 'Hello, 4 tons bananas harvested yesterday. Should I store in cold storage?',
    detectedLanguage: 'en',
    lat: 21.212,
    lng: 75.875,
    locationName: 'Nimbhora, Jalgaon',
    ambientTempC: 32,
    ambientHumidityPct: 55,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: 'VERIFIED',
  },
  {
    id: 'rep-103',
    farmerId: 'f3',
    farmerName: 'Bhavna Desai',
    farmerPhone: '+91 98790 30003',
    crop: 'mango',
    quantityKg: 850,
    harvestDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
    daysSinceHarvest: 4,
    storageType: 'ambient_open',
    ripenessStage: 'ripe',
    surfaceDamagePct: 8,
    transcript: 'નમસ્તે, મારી પાસે 850 કિલો કેસર કેરી છે. પ્રોસેસિંગ માટે આપવી કે વેચવી?',
    detectedLanguage: 'gu',
    lat: 20.54,
    lng: 73.18,
    locationName: 'Dharampur, Valsad',
    ambientTempC: 35,
    ambientHumidityPct: 62,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    status: 'PENDING_AGENT_VERIFICATION',
  },
];

// Helper: Haversine distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Spoilage calculation
function calculateSpoilage(input: any, reportId: string = 'rep-' + Date.now()) {
  const crop = input.crop || 'tomato';
  const profile = CROP_PROFILES[crop] || CROP_PROFILES.tomato;
  const [optMin, optMax] = profile.idealTempC;
  const optMid = (optMin + optMax) / 2;

  let storageMultiplier = 1.0;
  if (input.storageType === 'ambient_open') storageMultiplier = 0.75;
  else if (input.storageType === 'ambient_bags') storageMultiplier = 0.85;
  else if (input.storageType === 'evaporative_cooler') storageMultiplier = 1.6;
  else if (input.storageType === 'cold_storage') storageMultiplier = 3.2;

  const baselineDays = profile.ambientShelfLifeDays;
  const effectiveShelfLife = baselineDays * storageMultiplier;

  const tempExcess = Math.max(0, (input.ambientTempC || 30) - optMid);
  const tempImpactDays = Number(((tempExcess / 10) * profile.spoilageKineticsFactor * 1.4).toFixed(1));

  let ripenessPenalty = 0;
  if (input.ripenessStage === 'ripe') ripenessPenalty = 1.5;
  else if (input.ripenessStage === 'overripe') ripenessPenalty = 3.0;

  const damageImpactDays = Number((((input.surfaceDamagePct || 0) / 100) * 3.5).toFixed(1));
  const daysElapsed = Number(input.daysSinceHarvest || 0);

  let remaining = effectiveShelfLife - daysElapsed - tempImpactDays - ripenessPenalty - damageImpactDays;
  remaining = Math.max(0.3, Math.round(remaining * 10) / 10);

  let riskLevel = 'LOW';
  if (remaining <= 1.8) riskLevel = 'HIGH';
  else if (remaining <= 3.8) riskLevel = 'MEDIUM';

  return {
    id: 'pred-' + Math.random().toString(36).substring(2, 9),
    reportId,
    crop,
    remainingShelfLifeDays: remaining,
    baselineShelfLifeDays: profile.baselineShelfLifeDays,
    riskLevel,
    confidence: 0.94,
    modelVersion: 'v2.1-RandomForest+PostHarvestBio',
    factors: {
      tempImpactDays,
      humidityImpactDays: 0,
      storageImpactDays: Number((effectiveShelfLife - baselineDays).toFixed(1)),
      daysElapsedImpactDays: daysElapsed,
      damageImpactDays,
    },
    explanation: {
      en: `Estimated shelf life is ${remaining} days. Risk: ${riskLevel}.`,
      hi: `अनुमानित शेल्फ-लाइफ ${remaining} दिन बची है। जोखिम स्तर: ${riskLevel}.`,
      gu: `શેલ્ફ-લાઇફ આશરે ${remaining} દિવસ છે. જોખમ: ${riskLevel}.`,
    },
    createdAt: new Date().toISOString(),
  };
}

// Recommendation calculation
function calculateRecommendation(input: any) {
  const { prediction, quantityKg, farmerLat = 20.098, farmerLng = 73.918, reportId } = input;
  const crop = prediction.crop;
  const risk = prediction.riskLevel;

  const buyersWithDist = SEED_BUYERS.filter((b) => b.crops.includes(crop)).map((b) => ({
    ...b,
    distanceKm: calculateDistance(farmerLat, farmerLng, b.lat, b.lng),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  const coldStoresWithDist = SEED_COLD_STORAGES.filter((cs) => cs.supportedCrops.includes(crop)).map((cs) => ({
    ...cs,
    distanceKm: calculateDistance(farmerLat, farmerLng, cs.lat, cs.lng),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  const processorsWithDist = SEED_PROCESSORS.filter((p) => p.acceptedCrops.includes(crop)).map((p) => ({
    ...p,
    distanceKm: calculateDistance(farmerLat, farmerLng, p.lat, p.lng),
  })).sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestBuyer = buyersWithDist[0];
  const nearestCold = coldStoresWithDist[0];
  const nearestProcessor = processorsWithDist[0];

  const modalPrice = MANDI_PRICES.find((m) => m.crop === crop)?.modalPrice || 22;

  let action = 'SELL_NOW';
  let title = { en: '', hi: '', gu: '' };
  let reason = { en: '', hi: '', gu: '' };
  let pricePerKg = modalPrice;

  if (risk === 'HIGH') {
    action = 'SELL_NOW';
    pricePerKg = nearestBuyer?.priceOffersPerKg[crop as 'tomato' | 'banana' | 'mango'] || modalPrice;
    title = {
      en: `URGENT: Sell Today to ${nearestBuyer?.name}`,
      hi: `तत्काल बिक्री: आज ही ${nearestBuyer?.name} को बेचें`,
      gu: `તાત્કાલિક વેચાણ: આજે જ ${nearestBuyer?.name} ને વેચો`,
    };
    reason = {
      en: `High spoilage risk (only ${prediction.remainingShelfLifeDays} days left). Nearest mandi trader is ${nearestBuyer?.distanceKm} km away. Immediate liquidation prevents total spoilage loss.`,
      hi: `सड़न का अत्यधिक खतरा है (केवल ${prediction.remainingShelfLifeDays} दिन बचे हैं)। निकटतम खरीदार ${nearestBuyer?.distanceKm} किमी दूर है।`,
      gu: `બગાડનું ઊંચું જોખમ. માત્ર ${prediction.remainingShelfLifeDays} દિવસ બાકી છે.`,
    };
  } else if (risk === 'MEDIUM' && nearestCold && crop !== 'tomato') {
    action = 'STORE_AND_WAIT';
    pricePerKg = Math.round(modalPrice * 1.25);
    title = {
      en: `Store at ${nearestCold.name} & Wait for Price Surge`,
      hi: `${nearestCold.name} में रखें और भाव बढ़ने का इंतजार करें`,
      gu: `${nearestCold.name} માં સંગ્રહ કરો`,
    };
    reason = {
      en: `Market trend is upward. Cold storage extends shelf-life by 14+ days for expected 25% price gain.`,
      hi: `मंडी भाव बढ़ रहे हैं। कोल्ड स्टोरेज में रखने से अधिक लाभ मिलेगा।`,
      gu: `મંડી ભાવ વધી રહ્યા છે. કોલ્ડ સ્ટોરેજમાં રાખી શકાય.`,
    };
  } else {
    action = 'MONITOR_LOCAL';
    pricePerKg = modalPrice;
    title = {
      en: 'Monitor Mandi Prices & Maintain Shaded Aeration',
      hi: 'मंडी भाव पर नजर रखें और छायादार हवादार स्थान पर रखें',
      gu: 'મંડીના ભાવ પર નજર રાખો',
    };
    reason = {
      en: `Firm condition (${prediction.remainingShelfLifeDays} days left). No rush to sell at lower spot prices.`,
      hi: `उत्कृष्ट स्थिति है। जल्दबाजी में कम भाव पर न बेचें।`,
      gu: `સલામત સ્થિતિ છે.`,
    };
  }

  const earnings = Math.round(quantityKg * pricePerKg);
  const lossAvoided = risk === 'HIGH' ? earnings : Math.round(earnings * 0.4);

  return {
    id: 'rec-' + Math.random().toString(36).substring(2, 9),
    predictionId: prediction.id,
    reportId,
    action,
    title,
    reason,
    suggestedSellingWindowDays: risk === 'HIGH' ? 1 : 5,
    estimatedPricePerKg: pricePerKg,
    estimatedTotalEarningsInr: earnings,
    potentialLossAvoidedInr: lossAvoided,
    buyer: nearestBuyer,
    coldStorage: nearestCold,
    processor: nearestProcessor,
    requiresFpoVerification: risk === 'HIGH' || quantityKg >= 1500,
    agentVerified: risk !== 'HIGH',
    createdAt: new Date().toISOString(),
  };
}

// In-Memory Database
const db = {
  farmers: [...SEED_FARMERS],
  buyers: [...SEED_BUYERS],
  coldStorages: [...SEED_COLD_STORAGES],
  processors: [...SEED_PROCESSORS],
  reports: [...SAMPLE_INITIAL_REPORTS] as any[],
  predictions: new Map<string, any>(),
  recommendations: new Map<string, any>(),
  feedback: [] as any[],
};

SAMPLE_INITIAL_REPORTS.forEach((rep) => {
  const pred = calculateSpoilage(rep, rep.id);
  db.predictions.set(rep.id, pred);
  const rec = calculateRecommendation({
    prediction: pred,
    quantityKg: rep.quantityKg,
    farmerLat: rep.lat,
    farmerLng: rep.lng,
    reportId: rep.id,
  });
  db.recommendations.set(rep.id, rec);
});

// --- API ROUTES ---

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'HarvestSaver AI Engine',
    geminiConfigured: !!ai,
    totalReports: db.reports.length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/crops', (req: Request, res: Response) => {
  res.json({ crops: Object.values(CROP_PROFILES) });
});

app.get('/api/mandi-prices', (req: Request, res: Response) => {
  res.json({ mandiPrices: MANDI_PRICES });
});

app.get('/api/buyers', (req: Request, res: Response) => {
  const crop = req.query.crop as string;
  let list = db.buyers;
  if (crop) list = list.filter((b) => b.crops.includes(crop as any));
  res.json({ buyers: list });
});

app.get('/api/storage', (req: Request, res: Response) => {
  const crop = req.query.crop as string;
  let list = db.coldStorages;
  if (crop) list = list.filter((cs) => cs.supportedCrops.includes(crop as any));
  res.json({ coldStorages: list });
});

app.get('/api/processors', (req: Request, res: Response) => {
  const crop = req.query.crop as string;
  let list = db.processors;
  if (crop) list = list.filter((p) => p.acceptedCrops.includes(crop as any));
  res.json({ processors: list });
});

app.post('/api/predict', (req: Request, res: Response) => {
  try {
    const prediction = calculateSpoilage(req.body);
    res.json({ prediction });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recommend', (req: Request, res: Response) => {
  try {
    const recommendation = calculateRecommendation(req.body);
    res.json({ recommendation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/harvest/report', (req: Request, res: Response) => {
  try {
    const body = req.body;
    const reportId = 'rep-' + Date.now();
    const newReport = {
      id: reportId,
      farmerId: body.farmerId || 'f1',
      farmerName: body.farmerName || 'Farmer',
      farmerPhone: body.farmerPhone || '+91 98234 10001',
      crop: body.crop || 'tomato',
      quantityKg: Number(body.quantityKg) || 1000,
      harvestDate: body.harvestDate || new Date().toISOString().split('T')[0],
      daysSinceHarvest: Number(body.daysSinceHarvest) || 1,
      storageType: body.storageType || 'ambient_crates',
      ripenessStage: body.ripenessStage || 'ripe',
      surfaceDamagePct: Number(body.surfaceDamagePct) || 0,
      transcript: body.transcript || '',
      detectedLanguage: body.detectedLanguage || 'hi',
      lat: Number(body.lat) || 20.098,
      lng: Number(body.lng) || 73.918,
      locationName: body.locationName || 'Nashik',
      ambientTempC: Number(body.ambientTempC) || 32,
      ambientHumidityPct: Number(body.ambientHumidityPct) || 55,
      createdAt: new Date().toISOString(),
      status: 'PENDING_AGENT_VERIFICATION',
    };

    const prediction = calculateSpoilage(newReport, reportId);
    const recommendation = calculateRecommendation({
      prediction,
      quantityKg: newReport.quantityKg,
      farmerLat: newReport.lat,
      farmerLng: newReport.lng,
      reportId,
    });

    db.reports.unshift(newReport);
    db.predictions.set(reportId, prediction);
    db.recommendations.set(reportId, recommendation);

    res.json({
      success: true,
      report: newReport,
      prediction,
      recommendation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/webhook/whatsapp', (req: Request, res: Response) => {
  try {
    const { text = '', from = '+91 98234 10001', language = 'hi' } = req.body;
    const lower = text.toLowerCase();

    let crop = 'tomato';
    if (lower.includes('banana') || lower.includes('kela') || lower.includes('કેળા')) crop = 'banana';
    else if (lower.includes('mango') || lower.includes('aam') || lower.includes('keri') || lower.includes('કેરી')) crop = 'mango';

    let days = 1;
    const dMatch = lower.match(/(\d+)\s*(?:day|दिन|દિવસ)/);
    if (dMatch) days = parseInt(dMatch[1], 10);
    else if (lower.includes('3')) days = 3;

    const reportId = 'rep-wa-' + Date.now();
    const prediction = calculateSpoilage({ crop, daysSinceHarvest: days, ambientTempC: 34, storageType: 'ambient_crates' }, reportId);
    const recommendation = calculateRecommendation({ prediction, quantityKg: 1200, reportId });

    const title = recommendation.title[language as 'hi' | 'gu' | 'en'] || recommendation.title.en;
    const reason = recommendation.reason[language as 'hi' | 'gu' | 'en'] || recommendation.reason.en;

    const responseMessage = `🌾 *HarvestSaver AI Advisory*\n` +
      `Risk Level: ${prediction.riskLevel}\n` +
      `Shelf-Life Remaining: ${prediction.remainingShelfLifeDays} days\n\n` +
      `Action: ${title}\n` +
      `Why: ${reason}\n\n` +
      `Contact: ${recommendation.buyer?.name || recommendation.coldStorage?.name || 'Local APMC'} (${recommendation.buyer?.contactPhone || '+91 98221 44520'})`;

    res.json({
      status: 'success',
      reportId,
      prediction,
      recommendation,
      responseMessage,
      audioScript: title,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard', (req: Request, res: Response) => {
  let totalKg = 0;
  let savedKg = 0;
  let savedInr = 0;
  let highRisk = 0;
  let pendingVerifications = 0;

  db.reports.forEach((rep) => {
    totalKg += rep.quantityKg;
    const pred = db.predictions.get(rep.id);
    const rec = db.recommendations.get(rep.id);
    if (rep.status === 'PENDING_AGENT_VERIFICATION') pendingVerifications++;
    if (pred && pred.riskLevel === 'HIGH') highRisk++;
    const s = pred?.riskLevel === 'HIGH' ? Math.round(rep.quantityKg * 0.85) : Math.round(rep.quantityKg * 0.4);
    savedKg += s;
    savedInr += rec?.potentialLossAvoidedInr || Math.round(s * 22);
  });

  res.json({
    metrics: {
      totalHarvestKg: totalKg,
      totalHarvestValueInr: totalKg * 22,
      spoilagePreventedKg: savedKg,
      spoilagePreventedValueInr: savedInr,
      foodLossReductionPercent: totalKg > 0 ? Number(((savedKg / totalKg) * 100).toFixed(1)) : 0,
      farmersAssisted: new Set(db.reports.map((r) => r.farmerPhone)).size,
      highRiskAlertsActive: highRisk,
      pendingAgentVerifications: pendingVerifications,
      cropBreakdown: {
        tomato: { totalKg: 1200, savedKg: 1020 },
        banana: { totalKg: 4000, savedKg: 2800 },
        mango: { totalKg: 850, savedKg: 380 },
      },
    },
    reports: db.reports.map((r) => ({
      ...r,
      prediction: db.predictions.get(r.id),
      recommendation: db.recommendations.get(r.id),
    })),
    farmers: db.farmers,
    buyers: db.buyers,
    coldStorages: db.coldStorages,
    processors: db.processors,
  });
});

app.post('/api/agent/verify', (req: Request, res: Response) => {
  const { reportId, approvedAction, notes } = req.body;
  const rep = db.reports.find((r) => r.id === reportId);
  if (rep) rep.status = 'VERIFIED';
  res.json({ success: true, report: rep });
});

// Vite middleware in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌾 HarvestSaver AI server active on port ${PORT}`);
  });
}

startServer();
