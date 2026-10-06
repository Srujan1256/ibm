import { CropType, LanguageCode, Recommendation, SpoilagePrediction, StorageType } from '../types';

export interface WhatsAppIncomingMessage {
  from: string; // Phone number e.g. "+91 98234 10001"
  senderName?: string;
  messageType: 'text' | 'audio' | 'image';
  text?: string;
  audioBase64?: string;
  imageBase64?: string;
  location?: { lat: number; lng: number; name?: string };
}

export interface ExtractedHarvestIntent {
  crop: CropType;
  quantityKg: number;
  daysSinceHarvest: number;
  storageType: StorageType;
  locationName: string;
  ambientTempC: number;
  ambientHumidityPct: number;
  detectedLanguage: LanguageCode;
  confidence: number;
  rawText: string;
}

export function parseFarmerMessage(text: string): ExtractedHarvestIntent {
  const lower = text.toLowerCase();

  // Detect Language
  let detectedLanguage: LanguageCode = 'en';
  if (/[\u0900-\u097F]/.test(text) || /namaste|kisan|tamatar|kela|aam|garmi|bhejna/.test(lower)) {
    detectedLanguage = 'hi';
  } else if (/[\u0A80-\u0AFF]/.test(text) || /namaste|khedut|tameta|kera|keri|bhav|vechvu/.test(lower)) {
    detectedLanguage = 'gu';
  }

  // Detect Crop
  let crop: CropType = 'tomato';
  if (lower.includes('banana') || lower.includes('kela') || lower.includes('કેળા') || lower.includes('केला') || lower.includes('કેળુ')) {
    crop = 'banana';
  } else if (lower.includes('mango') || lower.includes('aam') || lower.includes('keri') || lower.includes('કેરી') || lower.includes('आम') || lower.includes('alphonso') || lower.includes('kesar')) {
    crop = 'mango';
  } else if (lower.includes('tomato') || lower.includes('tamatar') || lower.includes('tameta') || lower.includes('ટામેટા') || lower.includes('टमाटर')) {
    crop = 'tomato';
  }

  // Detect Quantity
  let quantityKg = 1000;
  // match "1200 kg" or "1200 kilo" or "1.5 ton" or "50 crate"
  const tonMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ton|tonne|टन|ટન)/);
  const kgMatch = lower.match(/(\d+(?:,\d+)?)\s*(?:kg|kilo|किलो|કિલો)/);
  const crateMatch = lower.match(/(\d+)\s*(?:crate|crates|क्रेट|કેરેટ)/);

  if (tonMatch) {
    quantityKg = Math.round(parseFloat(tonMatch[1]) * 1000);
  } else if (kgMatch) {
    quantityKg = parseInt(kgMatch[1].replace(/,/g, ''), 10);
  } else if (crateMatch) {
    quantityKg = parseInt(crateMatch[1], 10) * 25; // standard 25kg crate
  } else {
    // Look for raw numbers like "1200"
    const rawNumberMatch = text.match(/\b([1-9]\d{2,4})\b/);
    if (rawNumberMatch) {
      quantityKg = parseInt(rawNumberMatch[1], 10);
    }
  }

  // Detect Days Since Harvest
  let daysSinceHarvest = 1;
  const daysMatch = lower.match(/(\d+)\s*(?:day|days|din|दिन|દિવસ)/);
  if (daysMatch) {
    daysSinceHarvest = parseInt(daysMatch[1], 10);
  } else if (lower.includes('yesterday') || lower.includes('कल') || lower.includes('ગઈકાલે')) {
    daysSinceHarvest = 1;
  } else if (lower.includes('today') || lower.includes('आज') || lower.includes('આજે')) {
    daysSinceHarvest = 0;
  }

  // Detect Storage Type
  let storageType: StorageType = 'ambient_crates';
  if (lower.includes('cold') || lower.includes('कोल्ड') || lower.includes('કોલ્ડ')) {
    storageType = 'cold_storage';
  } else if (lower.includes('bag') || lower.includes('gunny') || lower.includes('बोरी') || lower.includes('કોથળા')) {
    storageType = 'ambient_bags';
  } else if (lower.includes('open') || lower.includes('ground') || lower.includes('खुले') || lower.includes('ખુલ્લા')) {
    storageType = 'ambient_open';
  } else if (lower.includes('cooler') || lower.includes('zecc')) {
    storageType = 'evaporative_cooler';
  }

  // Detect Location / Ambient Weather Estimate
  let locationName = 'Nashik Region';
  let ambientTempC = 33;
  let ambientHumidityPct = 52;

  if (lower.includes('jalgaon') || lower.includes('जलगांव') || lower.includes('જલગાંવ')) {
    locationName = 'Jalgaon, MH';
    ambientTempC = 36;
    ambientHumidityPct = 45;
  } else if (lower.includes('valsad') || lower.includes('वलसाड') || lower.includes('વલસાડ')) {
    locationName = 'Valsad, GJ';
    ambientTempC = 32;
    ambientHumidityPct = 68;
  } else if (lower.includes('kolar') || lower.includes('कोलार')) {
    locationName = 'Kolar, KA';
    ambientTempC = 29;
    ambientHumidityPct = 58;
  } else if (crop === 'banana') {
    locationName = 'Jalgaon, MH';
    ambientTempC = 35;
  } else if (crop === 'mango') {
    locationName = 'Valsad, GJ';
    ambientTempC = 33;
  }

  return {
    crop,
    quantityKg,
    daysSinceHarvest,
    storageType,
    locationName,
    ambientTempC,
    ambientHumidityPct,
    detectedLanguage,
    confidence: 0.94,
    rawText: text,
  };
}

export function formatWhatsAppReply(
  prediction: SpoilagePrediction,
  recommendation: Recommendation,
  lang: LanguageCode = 'hi',
  farmerName: string = 'Kisan Bhai'
): { text: string; audioScript: string } {
  const cropNames = {
    tomato: { en: 'Tomato', hi: 'टमाटर', gu: 'ટામેટાં' },
    banana: { en: 'Banana', hi: 'केला', gu: 'કેળાં' },
    mango: { en: 'Mango', hi: 'आम', gu: 'કેરી' },
  }[prediction.crop];

  const riskBadge = {
    HIGH: { en: '🔴 HIGH RISK (Immediate Action)', hi: '🔴 उच्च जोखिम (तत्काल कार्रवाई)', gu: '🔴 ઊંચું જોખમ (તાત્કાલિક પગલું)' },
    MEDIUM: { en: '🟡 MEDIUM RISK (Plan Ahead)', hi: '🟡 मध्यम जोखिम (नियोजन करें)', gu: '🟡 મધ્યમ જોખમ (આયોજન કરો)' },
    LOW: { en: '🟢 LOW RISK (Safe Condition)', hi: '🟢 सुरक्षित स्थिति (कोई जल्दी नहीं)', gu: '🟢 સલામત સ્થિતિ (કોઈ ઉતાવળ નથી)' },
  }[prediction.riskLevel][lang];

  const title = recommendation.title[lang];
  const reason = recommendation.reason[lang];
  const explain = prediction.explanation[lang];

  let actionDetails = '';
  if (recommendation.buyer) {
    const b = recommendation.buyer;
    actionDetails = lang === 'hi'
      ? `🏢 *अनुशंसित खरीदार:* ${b.name}\n📍 *दूरी:* ${b.distanceKm} किमी\n💰 *अनुमानित भाव:* ₹${recommendation.estimatedPricePerKg}/किलो\n📞 *संपर्क:* ${b.contactPhone}`
      : lang === 'gu'
      ? `🏢 *ભલામણ કરેલ ખરીદદાર:* ${b.name}\n📍 *અંતર:* ${b.distanceKm} કિમી\n💰 *અંદાજિત ભાવ:* ₹${recommendation.estimatedPricePerKg}/કિલો\n📞 *સંપર્ક:* ${b.contactPhone}`
      : `🏢 *Recommended Buyer:* ${b.name}\n📍 *Distance:* ${b.distanceKm} km\n💰 *Expected Price:* ₹${recommendation.estimatedPricePerKg}/kg\n📞 *Contact:* ${b.contactPhone}`;
  } else if (recommendation.coldStorage) {
    const cs = recommendation.coldStorage;
    actionDetails = lang === 'hi'
      ? `❄️ *अनुशंसित कोल्ड स्टोरेज:* ${cs.name}\n📍 *दूरी:* ${cs.distanceKm} किमी\n📦 *किराया:* ₹${cs.pricePerDayPerCrate}/क्रेट/दिन\n📞 *संपर्क:* ${cs.contactPhone}`
      : lang === 'gu'
      ? `❄️ *ભલામણ કરેલ કોલ્ડ સ્ટોરેજ:* ${cs.name}\n📍 *અંતર:* ${cs.distanceKm} કિમી\n📦 *ભાડું:* ₹${cs.pricePerDayPerCrate}/કેરેટ/દિવસ\n📞 *સંપર્ક:* ${cs.contactPhone}`
      : `❄️ *Recommended Cold Storage:* ${cs.name}\n📍 *Distance:* ${cs.distanceKm} km\n📦 *Fee:* ₹${cs.pricePerDayPerCrate}/crate/day\n📞 *Contact:* ${cs.contactPhone}`;
  } else if (recommendation.processor) {
    const p = recommendation.processor;
    actionDetails = lang === 'hi'
      ? `🏭 *प्रोसेसिंग प्लांट:* ${p.name}\n📍 *दूरी:* ${p.distanceKm} किमी\n🥫 *उत्पाद:* ${p.processType}\n💰 *भाव:* ₹${recommendation.estimatedPricePerKg}/किलो\n📞 *संपर्क:* ${p.contactPhone}`
      : lang === 'gu'
      ? `🏭 *પ્રોસેસિંગ પ્લાન્ટ:* ${p.name}\n📍 *અંતર:* ${p.distanceKm} કિમી\n🥫 *ઉત્પાદન:* ${p.processType}\n💰 *ભાવ:* ₹${recommendation.estimatedPricePerKg}/કિલો\n📞 *સંપર્ક:* ${p.contactPhone}`
      : `🏭 *Processing Plant:* ${p.name}\n📍 *Distance:* ${p.distanceKm} km\n🥫 *Output:* ${p.processType}\n💰 *Price:* ₹${recommendation.estimatedPricePerKg}/kg\n📞 *Contact:* ${p.contactPhone}`;
  }

  let textMsg = '';
  let audioScript = '';

  if (lang === 'hi') {
    textMsg = `🌾 *हॉर्वेस्टसेवर एआई परामर्श* | *HarvestSaver AI*\n` +
      `नमस्ते ${farmerName} जी! आपके *${cropNames.hi}* की फसल का विश्लेषण:\n\n` +
      `📊 *स्थिति:* ${riskBadge}\n` +
      `⏳ *अनुमानित शेल्फ-लाइफ:* लगभग *${prediction.remainingShelfLifeDays} दिन*\n` +
      `💵 *संभावित बचत:* ₹${recommendation.potentialLossAvoidedInr.toLocaleString('en-IN')}\n\n` +
      `💡 *हमारी मुख्य सलाह:*\n*${title}*\n\n` +
      `🔍 *कारण:* ${reason}\n\n` +
      `${actionDetails}\n\n` +
      `ℹ️ *नोट:* यह अनुमान मौसम व वैज्ञानिक मानकों पर आधारित है। सहायता के लिए '1' दबाएं या अपने FPO एजेंट से बात करें।`;

    audioScript = `नमस्ते ${farmerName} जी। आपके ${cropNames.hi} के लिए हॉर्वेस्टसेवर एआई की सलाह है। शेल्फ लाइफ केवल ${prediction.remainingShelfLifeDays} दिन बची है। ${title}। निकटतम स्थान पर संपर्क करें और फसल को खराब होने से बचाएं।`;
  } else if (lang === 'gu') {
    textMsg = `🌾 *હાર્વેસ્ટસેવર એઆઈ સલાહકાર* | *HarvestSaver AI*\n` +
      `નમસ્તે ${farmerName} ભાઈ/બહેન! તમારા *${cropNames.gu}* ના પાકનું પૃથ્થકરણ:\n\n` +
      `📊 *સ્થિતિ:* ${riskBadge}\n` +
      `⏳ *બાકી રહેલ શેલ્ફ-લાઇફ:* આશરે *${prediction.remainingShelfLifeDays} દિવસ*\n` +
      `💵 *બચાવી શકાય તેવું નુકસાન:* ₹${recommendation.potentialLossAvoidedInr.toLocaleString('en-IN')}\n\n` +
      `💡 *અમારી મુખ્ય ભલામણ:*\n*${title}*\n\n` +
      `🔍 *કારણ:* ${reason}\n\n` +
      `${actionDetails}\n\n` +
      `ℹ️ *નોંધ:* આ સલાહ કૃષિ વૈજ્ઞાનિક મોડલ પર આધારિત છે. વધુ વિગત માટે FPO એજન્ટનો સંપર્ક કરો.`;

    audioScript = `નમસ્તે ${farmerName} ભાઈ। તમારા ${cropNames.gu} માટે હાર્વેસ્ટસેવર એઆઈ ની ભલામણ છે. આશરે ${prediction.remainingShelfLifeDays} દિવસની શેલ્ફ લાઇફ બાકી છે. ${title}।`;
  } else {
    textMsg = `🌾 *HarvestSaver AI Advisory*\n` +
      `Hello ${farmerName}! Analysis for your *${cropNames.en}*:\n\n` +
      `📊 *Risk Level:* ${riskBadge}\n` +
      `⏳ *Estimated Shelf-Life:* ~*${prediction.remainingShelfLifeDays} days*\n` +
      `💵 *Loss Prevention Value:* ₹${recommendation.potentialLossAvoidedInr.toLocaleString('en-IN')}\n\n` +
      `💡 *Recommended Action:*\n*${title}*\n\n` +
      `🔍 *Why:* ${reason}\n\n` +
      `${actionDetails}\n\n` +
      `ℹ️ *Responsible AI Notice:* Predictions are statistical estimates based on ambient temperatures and physiological respiration rates.`;

    audioScript = `Hello ${farmerName}. Your ${cropNames.en} have approximately ${prediction.remainingShelfLifeDays} days of shelf life remaining. We recommend: ${title}. Check your WhatsApp details to contact the buyer or facility.`;
  }

  return { text: textMsg, audioScript };
}
