#!/usr/bin/env python3
"""
HarvestSaver AI - End-to-End Simulation Demo
Demonstrates the full tomato farmer pipeline:
Voice Note -> Transcription -> Entity Extraction -> Spoilage ML -> Recommendation Engine -> WhatsApp Reply
"""

import sys
import os
import json
import time

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.ml_model import model_instance
from app.recommendations import generate_recommendation

def run_tomato_farmer_demo():
    print("=" * 80)
    print("🌾 HARVESTSAVER AI: END-TO-END DEMO SIMULATION")
    print("Project: HarvestSaver AI | SDG 2 Zero Hunger & SDG 12.3 Food Loss Reduction")
    print("Scenario: Smallholder Tomato Farmer Ramesh Patel, Nashik District, Maharashtra")
    print("=" * 80)
    time.sleep(1)

    print("\n[STEP 1: INCOMING WHATSAPP VOICE NOTE]")
    print("Farmer Phone: +91 98234 10001 (Ramesh Patel)")
    print("Audio File: audio_voice_note_101.ogg (Duration: 9.4s)")
    print("Status: Received at Twilio / WhatsApp Cloud API Webhook")
    time.sleep(1)

    print("\n[STEP 2: SPEECH-TO-TEXT & LANGUAGE DETECTION (Whisper / Bhashini / Gemini)]")
    raw_transcript = "नमस्ते, मैंने 3 दिन पहले 1200 किलो टमाटर तोड़े थे। यहाँ बहुत तेज गर्मी है 34 डिग्री, क्रेट में रखे हैं। कब और कहाँ बेचूं?"
    detected_lang = "hi (Hindi)"
    confidence = 0.96
    print(f"Transcript: \"{raw_transcript}\"")
    print(f"Detected Language: {detected_lang} (Confidence: {confidence})")
    time.sleep(1)

    print("\n[STEP 3: ENTITY & INTENT EXTRACTION]")
    extracted_entities = {
        "crop": "tomato",
        "quantity_kg": 1200,
        "days_since_harvest": 3,
        "storage_type": "ambient_crates",
        "ambient_temp_c": 34.0,
        "location": "Ozar, Nashik, Maharashtra",
        "intent": "spoilage_advisory_and_buyer_match"
    }
    print(json.dumps(extracted_entities, indent=2))
    time.sleep(1)

    print("\n[STEP 4: ML SPOILAGE PREDICTION MODEL RUN]")
    print("Running Random Forest Post-Harvest Degradation Regressor...")
    prediction = model_instance.predict(
        crop="tomato",
        days=3,
        temp=34.0,
        humidity=48.0,
        storage="ambient_crates"
    )
    print(f"-> Remaining Shelf-Life: {prediction['remaining_shelf_life_days']} DAYS")
    print(f"-> Spoilage Risk Level:   🔴 {prediction['risk_level']} RISK")
    print(f"-> Model Confidence:      {int(prediction['confidence'] * 100)}%")
    print(f"-> Feature Penalties:     {prediction['feature_impacts']}")
    time.sleep(1)

    print("\n[STEP 5: DATA-BACKED RECOMMENDATION ENGINE]")
    print("Matching against 5 Local Buyers, 3 Cold Storages, 3 Food Processors...")
    rec = generate_recommendation(
        crop="tomato",
        risk=prediction["risk_level"],
        shelf_life=prediction["remaining_shelf_life_days"],
        quantity_kg=1200.0
    )
    print(f"-> Action:                  {rec['action']}")
    print(f"-> Target Facility:         {rec['nearest_entity']['name']}")
    print(f"-> Distance:                {rec['nearest_entity']['distance_km']} km")
    print(f"-> Negotiated Mandi Rate:   ₹{rec['estimated_price_per_kg']}/kg")
    print(f"-> Farmer Revenue:          ₹{rec['estimated_total_earnings_inr']:,}")
    print(f"-> Food Loss Prevented:     ₹{rec['potential_loss_avoided_inr']:,} (1,200 kg saved!)")
    print(f"-> FPO Agent Verification:  {'REQUIRED (High Risk Pilot Safeguard)' if rec['requires_fpo_verification'] else 'Auto-approved'}")
    time.sleep(1)

    print("\n[STEP 6: LOCALIZED WHATSAPP MULTI-MODAL RESPONSE (TEXT + AUDIO)]")
    whatsapp_text = f"""
🌾 *हॉर्वेस्टसेवर एआई परामर्श* | *HarvestSaver AI*
नमस्ते रमेश जी! आपके *टमाटर* की 1200 किलो फसल का विश्लेषण:

📊 *स्थिति:* 🔴 उच्च जोखिम (तत्काल कार्रवाई)
⏳ *अनुमानित शेल्फ-लाइफ:* लगभग *{prediction['remaining_shelf_life_days']} दिन*
💵 *संभावित बचत:* ₹{rec['potential_loss_avoided_inr']:,}

💡 *हमारी मुख्य सलाह:*
*{rec['title']['hi']}*

🔍 *कारण:* {rec['reason']['hi']}

🏢 *अनुशंसित खरीदार:* {rec['nearest_entity']['name']}
📍 *दूरी:* {rec['nearest_entity']['distance_km']} किमी
💰 *भाव:* ₹{rec['estimated_price_per_kg']}/किलो
📞 *संपर्क:* {rec['nearest_entity']['phone']}

ℹ️ *नोट:* यह सलाह FPO फील्ड डेस्क से सत्यापित है।
"""
    print(whatsapp_text)
    print("🔊 Voice Note Sent: [Audio generated in Hindi via TTS: Kore voice]")
    print("=" * 80)
    print("✅ DEMO COMPLETE: Result delivered to farmer under 45 seconds!")
    print("=" * 80)

if __name__ == "__main__":
    run_tomato_farmer_demo()
