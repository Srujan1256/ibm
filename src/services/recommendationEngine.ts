import { ActionType, Buyer, ColdStorage, CropType, FoodProcessor, Recommendation, SpoilagePrediction } from '../types';
import { MANDI_PRICES, SEED_BUYERS, SEED_COLD_STORAGES, SEED_PROCESSORS } from '../data/seedData';

// Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
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

export interface RecommendationInput {
  prediction: SpoilagePrediction;
  quantityKg: number;
  farmerLat: number;
  farmerLng: number;
  ripenessStage?: string;
  reportId: string;
}

export function generateRecommendation(input: RecommendationInput): Recommendation {
  const { prediction, quantityKg, farmerLat, farmerLng, reportId } = input;
  const crop = prediction.crop;
  const risk = prediction.riskLevel;

  // Filter and sort nearby buyers
  const buyersWithDistance: Buyer[] = SEED_BUYERS
    .filter((b) => b.crops.includes(crop))
    .map((b) => ({
      ...b,
      distanceKm: calculateDistanceKm(farmerLat, farmerLng, b.lat, b.lng),
    }))
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  // Filter and sort nearby cold storages
  const coldStoragesWithDistance: ColdStorage[] = SEED_COLD_STORAGES
    .filter((cs) => cs.supportedCrops.includes(crop) && cs.availableCapacityMt * 1000 >= quantityKg)
    .map((cs) => ({
      ...cs,
      distanceKm: calculateDistanceKm(farmerLat, farmerLng, cs.lat, cs.lng),
    }))
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  // Filter and sort nearby processors
  const processorsWithDistance: FoodProcessor[] = SEED_PROCESSORS
    .filter((p) => p.acceptedCrops.includes(crop))
    .map((p) => ({
      ...p,
      distanceKm: calculateDistanceKm(farmerLat, farmerLng, p.lat, p.lng),
    }))
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const nearestBuyer = buyersWithDistance[0];
  const nearestColdStorage = coldStoragesWithDistance[0];
  const nearestProcessor = processorsWithDistance[0];

  const mandiFeed = MANDI_PRICES.find((m) => m.crop === crop);
  const basePricePerKg = mandiFeed ? mandiFeed.modalPrice : 20;

  let action: ActionType = 'SELL_NOW';
  let title = { en: '', hi: '', gu: '' };
  let reason = { en: '', hi: '', gu: '' };
  let suggestedSellingWindowDays = 1;
  let estimatedPricePerKg = basePricePerKg;
  let alternativeAction: Recommendation['alternativeAction'];

  // Decision Tree Engine
  if (risk === 'HIGH') {
    // If buyer within 45 km, sell today
    if (nearestBuyer && (nearestBuyer.distanceKm || 0) <= 60) {
      action = 'SELL_NOW';
      estimatedPricePerKg = nearestBuyer.priceOffersPerKg[crop] || basePricePerKg;
      suggestedSellingWindowDays = 1;
      title = {
        en: `URGENT: Sell Today to ${nearestBuyer.name}`,
        hi: `तत्काल बिक्री: आज ही ${nearestBuyer.name} को बेचें`,
        gu: `તાત્કાલિક વેચાણ: આજે જ ${nearestBuyer.name} ને વેચો`,
      };
      reason = {
        en: `High spoilage risk (only ${prediction.remainingShelfLifeDays} days left). Nearest mandi trader is just ${nearestBuyer.distanceKm} km away offering ₹${estimatedPricePerKg}/kg. Immediate liquidation prevents ₹${Math.round(quantityKg * estimatedPricePerKg)} total spoilage loss.`,
        hi: `सड़न का अत्यधिक खतरा है (केवल ${prediction.remainingShelfLifeDays} दिन बचे हैं)। निकटतम खरीदार केवल ${nearestBuyer.distanceKm} किमी दूर ₹${estimatedPricePerKg}/किलो का भाव दे रहा है। आज बेचने से ₹${Math.round(quantityKg * estimatedPricePerKg)} का पूरा नुकसान बच जाएगा।`,
        gu: `બગાડનું ઊંચું જોખમ (માત્ર ${prediction.remainingShelfLifeDays} દિવસ બાકી છે). નજીકના વેપારી માત્ર ${nearestBuyer.distanceKm} કિમી દૂર ₹${estimatedPricePerKg}/કિલો આપી રહ્યા છે. આજે વેચવાથી ₹${Math.round(quantityKg * estimatedPricePerKg)} નું નુકસાન અટકશે.`,
      };

      if (nearestProcessor) {
        alternativeAction = {
          action: 'PROCESS_VALUE_ADD',
          entityName: nearestProcessor.name,
          estimatedPricePerKg: nearestProcessor.buyingPricePerKg[crop] || estimatedPricePerKg - 4,
          reason: {
            en: `If mandi rejects grade, deliver to ${nearestProcessor.name} (${nearestProcessor.distanceKm} km) for paste/pulp.`,
            hi: `यदि मंडी में ग्रेडिंग पर विवाद हो, तो ${nearestProcessor.name} (${nearestProcessor.distanceKm} किमी) को प्यूरी/पल्प हेतु दें।`,
            gu: `જો મંડીમાં અસ્વીકાર થાય, તો ${nearestProcessor.name} ને પલ્પ/પ્રોસેસિંગ માટે આપો.`,
          },
        };
      }
    } else if (nearestProcessor) {
      action = 'PROCESS_VALUE_ADD';
      estimatedPricePerKg = nearestProcessor.buyingPricePerKg[crop] || basePricePerKg - 3;
      suggestedSellingWindowDays = 1;
      title = {
        en: `Dispatch to Local Food Processor (${nearestProcessor.name})`,
        hi: `स्थानीय प्रोसेसिंग यूनिट (${nearestProcessor.name}) को भेजें`,
        gu: `સ્થાનિક પ્રોસેસિંગ યુનિટ (${nearestProcessor.name}) ને મોકલો`,
      };
      reason = {
        en: `Mandi is distant or produce is overripe. ${nearestProcessor.name} is ${nearestProcessor.distanceKm} km away and buys directly for ${nearestProcessor.processType} at ₹${estimatedPricePerKg}/kg.`,
        hi: `मंडी दूर है अथवा माल अधिक पक चुका है। ${nearestProcessor.name} केवल ${nearestProcessor.distanceKm} किमी दूर है और ${nearestProcessor.processType} हेतु ₹${estimatedPricePerKg}/किलो में खरीदेगा।`,
        gu: `મંડી દૂર છે અથવા માલ વધુ પાકી ગયો છે. ${nearestProcessor.name} માત્ર ${nearestProcessor.distanceKm} કિમી દૂર છે અને ₹${estimatedPricePerKg}/કિલો ખરીદે છે.`,
      };
    }
  } else if (risk === 'MEDIUM') {
    if (nearestColdStorage && (nearestColdStorage.distanceKm || 0) <= 45 && crop !== 'tomato') {
      // Banana or Mango storage advantage
      action = 'STORE_AND_WAIT';
      const expectedFuturePrice = Math.round(basePricePerKg * 1.25);
      estimatedPricePerKg = expectedFuturePrice;
      suggestedSellingWindowDays = 7;
      title = {
        en: `Store at ${nearestColdStorage.name} & Wait for Price Surge`,
        hi: `${nearestColdStorage.name} में रखें और भाव बढ़ने का इंतजार करें`,
        gu: `${nearestColdStorage.name} માં સંગ્રહ કરો અને ભાવ વધારાની રાહ જુઓ`,
      };
      reason = {
        en: `Produce quality is good. Mandi prices are trending upward (+7.2%). Storing at ${nearestColdStorage.name} (${nearestColdStorage.distanceKm} km away, ₹${nearestColdStorage.pricePerDayPerCrate}/crate/day) extends shelf-life by 14+ days, yielding ~₹${expectedFuturePrice - basePricePerKg}/kg extra profit.`,
        hi: `उत्पाद की गुणवत्ता अच्छी है और मंडी भाव ऊपर की ओर बढ़ रहे हैं। ${nearestColdStorage.name} (${nearestColdStorage.distanceKm} किमी, ₹${nearestColdStorage.pricePerDayPerCrate}/क्रेट/दिन) में रखने पर 14 दिन तक सुरक्षित रहेगा और ₹${expectedFuturePrice - basePricePerKg}/किलो अतिरिक्त लाभ होगा।`,
        gu: `ઉત્પાદનની ગુણવત્તા સારી છે અને મંડીના ભાવ વધી રહ્યા છે. ${nearestColdStorage.name} માં સંગ્રહ કરવાથી 14 દિવસ શેલ્ફ-લાઇફ વધશે અને વધારાનો નફો મળશે.`,
      };

      if (nearestBuyer) {
        alternativeAction = {
          action: 'SELL_NOW',
          entityName: nearestBuyer.name,
          estimatedPricePerKg: nearestBuyer.priceOffersPerKg[crop] || basePricePerKg,
          reason: {
            en: `If immediate cash is required, sell today at ₹${nearestBuyer.priceOffersPerKg[crop]}/kg to ${nearestBuyer.name}.`,
            hi: `यदि तत्काल नकद राशि की आवश्यकता हो, तो आज ही ₹${nearestBuyer.priceOffersPerKg[crop]}/किलो पर ${nearestBuyer.name} को बेचें।`,
            gu: `જો તાત્કાલિક રોકડ જોઈએ, તો આજે જ વેચી દો.`,
          },
        };
      }
    } else {
      // Sell in next 24-48 hours
      action = 'SELL_NOW';
      estimatedPricePerKg = nearestBuyer ? nearestBuyer.priceOffersPerKg[crop] : basePricePerKg;
      suggestedSellingWindowDays = 2;
      title = {
        en: `Schedule Sale within 36 Hours to ${nearestBuyer ? nearestBuyer.name : 'Nearest Mandi'}`,
        hi: `अगले 36 घंटों में ${nearestBuyer ? nearestBuyer.name : 'मंडी'} में बिक्री सुनिश्चित करें`,
        gu: `આગામી 36 કલાકમાં ${nearestBuyer ? nearestBuyer.name : 'મંડી'} માં વેચાણ કરો`,
      };
      reason = {
        en: `Produce firmness allows 2 days buffer. Lock delivery with ${nearestBuyer?.name} (${nearestBuyer?.distanceKm} km) before ambient heat causes softening.`,
        hi: `माल की मजबूती 2 दिन सुरक्षित है। अत्यधिक गर्मी के कारण नरमी आने से पहले ${nearestBuyer?.name} के साथ बिक्री तय करें।`,
        gu: `માલ હજુ 2 દિવસ સારો રહેશે. ગરમી વધે તે પહેલાં વેચાણ કરી લો.`,
      };
    }
  } else {
    // LOW RISK
    action = 'MONITOR_LOCAL';
    suggestedSellingWindowDays = 5;
    title = {
      en: 'Monitor Mandi Prices & Maintain Shaded Aeration',
      hi: 'मंडी भाव पर नजर रखें और छायादार हवादार स्थान पर रखें',
      gu: 'મંડીના ભાવ પર નજર રાખો અને છાંયડામાં રાખો',
    };
    reason = {
      en: `Excellent post-harvest condition (${prediction.remainingShelfLifeDays} days estimated shelf life). No rush to sell at lower spot prices. Keep in ventilated crates, avoid direct sunlight, and track morning mandi auction rates.`,
      hi: `उत्कृष्ट स्थिति (लगभग ${prediction.remainingShelfLifeDays} दिन की शेल्फ-लाइफ)। कम भाव में जल्दबाजी में बेचने की आवश्यकता नहीं है। क्रेट्स में छायादार स्थान पर रखें और सुबह की बोली का निरीक्षण करें।`,
      gu: `ખૂબ જ ઉત્તમ સ્થિતિ (${prediction.remainingShelfLifeDays} દિવસ શેલ્ફ-લાઇફ). ઓછા ભાવમાં ઉતાવળે વેચવાની જરૂર નથી. છાંયડામાં હવા ઉજાસવાળી જગ્યાએ રાખો.`,
    };

    if (nearestColdStorage) {
      alternativeAction = {
        action: 'STORE_AND_WAIT',
        entityName: nearestColdStorage.name,
        estimatedPricePerKg: basePricePerKg + 6,
        reason: {
          en: `Can transfer to cold store to wait for festival demand.`,
          hi: `त्योहार के सीजन में ऊंचे भाव के लिए कोल्ड स्टोर में रख सकते हैं।`,
          gu: `તહેવારોના સમયમાં ઊંચા ભાવ માટે કોલ્ડ સ્ટોરેજમાં રાખી શકાય.`,
        },
      };
    }
  }

  const estimatedTotalEarningsInr = Math.round(quantityKg * estimatedPricePerKg);
  // Potential loss avoided: if spoiled, farmer loses 100% of harvest value
  const potentialLossAvoidedInr = risk === 'HIGH' ? estimatedTotalEarningsInr : Math.round(estimatedTotalEarningsInr * 0.4);

  // Human-in-the-loop: high risk or high volume needs FPO agent verification
  const requiresFpoVerification = risk === 'HIGH' || quantityKg >= 1500;

  return {
    id: 'rec-' + Math.random().toString(36).substring(2, 9),
    predictionId: prediction.id,
    reportId,
    action,
    title,
    reason,
    suggestedSellingWindowDays,
    estimatedPricePerKg,
    estimatedTotalEarningsInr,
    potentialLossAvoidedInr,
    buyer: nearestBuyer,
    coldStorage: nearestColdStorage,
    processor: nearestProcessor,
    alternativeAction,
    requiresFpoVerification,
    agentVerified: !requiresFpoVerification, // auto-verified if low risk, else needs field agent
    createdAt: new Date().toISOString(),
  };
}
