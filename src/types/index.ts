export type CropType = 'tomato' | 'banana' | 'mango';

export type LanguageCode = 'hi' | 'gu' | 'en';

export type StorageType = 
  | 'ambient_open' // Open piles or ground
  | 'ambient_crates' // Plastic or wooden crates in shade
  | 'ambient_bags' // Gunny / burlap bags
  | 'evaporative_cooler' // Zero-energy cool chamber / evaporative
  | 'cold_storage'; // Controlled cold room (4-12°C)

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ActionType = 'SELL_NOW' | 'STORE_AND_WAIT' | 'PROCESS_VALUE_ADD' | 'MONITOR_LOCAL';

export type RipenessStage = 'unripe' | 'breaker_turning' | 'ripe' | 'overripe';

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  language: LanguageCode;
  village: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  fpoId: string;
  fpoName: string;
}

export interface HarvestReport {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  crop: CropType;
  quantityKg: number;
  harvestDate: string; // ISO date
  daysSinceHarvest: number;
  storageType: StorageType;
  photoUrl?: string;
  ripenessStage?: RipenessStage;
  surfaceDamagePct?: number;
  voiceAudioUrl?: string;
  transcript?: string;
  detectedLanguage: LanguageCode;
  lat: number;
  lng: number;
  locationName: string;
  ambientTempC: number;
  ambientHumidityPct: number;
  createdAt: string;
  status: 'PENDING_AGENT_VERIFICATION' | 'VERIFIED' | 'DISPATCHED_TO_FARMER' | 'ACTED_BY_FARMER';
}

export interface SpoilagePrediction {
  id: string;
  reportId: string;
  crop: CropType;
  remainingShelfLifeDays: number;
  baselineShelfLifeDays: number;
  riskLevel: RiskLevel;
  confidence: number; // 0 to 1
  modelVersion: string;
  factors: {
    tempImpactDays: number;
    humidityImpactDays: number;
    storageImpactDays: number;
    daysElapsedImpactDays: number;
    damageImpactDays: number;
  };
  explanation: {
    en: string;
    hi: string;
    gu: string;
  };
  createdAt: string;
}

export interface Buyer {
  id: string;
  name: string;
  type: 'Mandi Trader' | 'Retail Supermarket' | 'Exporter' | 'Aggregator FPO';
  contactPhone: string;
  village: string;
  district: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  crops: CropType[];
  capacityKg: number;
  priceOffersPerKg: Record<CropType, number>;
  rating: number;
}

export interface ColdStorage {
  id: string;
  name: string;
  contactPhone: string;
  village: string;
  district: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  totalCapacityMt: number;
  availableCapacityMt: number;
  pricePerDayPerCrate: number; // in INR
  tempRangeC: string;
  supportedCrops: CropType[];
  hasChillingInjuryProtection: boolean;
}

export interface FoodProcessor {
  id: string;
  name: string;
  contactPhone: string;
  village: string;
  district: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  acceptedCrops: CropType[];
  processType: string; // e.g., 'Tomato Paste & Puree', 'Banana Chips & Powder', 'Mango Pulp & Pickle'
  minAcceptableKg: number;
  buyingPricePerKg: Record<CropType, number>;
  capacityPerDayKg: number;
}

export interface Recommendation {
  id: string;
  predictionId: string;
  reportId: string;
  action: ActionType;
  title: {
    en: string;
    hi: string;
    gu: string;
  };
  reason: {
    en: string;
    hi: string;
    gu: string;
  };
  suggestedSellingWindowDays: number;
  estimatedPricePerKg: number;
  estimatedTotalEarningsInr: number;
  potentialLossAvoidedInr: number;
  buyer?: Buyer;
  coldStorage?: ColdStorage;
  processor?: FoodProcessor;
  alternativeAction?: {
    action: ActionType;
    reason: {
      en: string;
      hi: string;
      gu: string;
    };
    entityName: string;
    estimatedPricePerKg: number;
  };
  requiresFpoVerification: boolean;
  agentVerified: boolean;
  verifiedByAgentId?: string;
  verifiedAt?: string;
  agentNotes?: string;
  createdAt: string;
}

export interface MandiPriceFeed {
  crop: CropType;
  marketName: string;
  state: string;
  minPrice: number;
  modalPrice: number;
  maxPrice: number;
  unit: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  trendPercent: number;
  lastUpdated: string;
}

export interface FarmerFeedback {
  id: string;
  recommendationId: string;
  farmerId: string;
  acted: boolean;
  actionTaken: ActionType | 'OTHER';
  outcomeSuccess: boolean;
  actualPriceReceivedPerKg?: number;
  spoilagePercentageObserved: number;
  rating: number; // 1 to 5
  notes?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalHarvestKg: number;
  totalHarvestValueInr: number;
  spoilagePreventedKg: number;
  spoilagePreventedValueInr: number;
  foodLossReductionPercent: number; // SDG 12.3
  farmersAssisted: number;
  highRiskAlertsActive: number;
  pendingAgentVerifications: number;
  cropBreakdown: Record<CropType, { totalKg: number; savedKg: number }>;
}
