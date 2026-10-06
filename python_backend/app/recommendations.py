"""
Recommendation Engine for HarvestSaver AI (Python Edition)
Implements decision rules:
- HIGH risk + buyer nearby -> Sell today
- MEDIUM risk + cold storage available -> Store and wait
- Produce ripe or surplus -> Process for value-add
- LOW risk -> Monitor and wait
"""

from typing import Dict, Any

SEED_BUYERS = [
    {"id": "b1", "name": "Nashik APMC Mandi Stall 42", "crops": ["tomato", "banana"], "distance_km": 14.5, "price_offer": 24.0, "phone": "+91 98221 44520"},
    {"id": "b2", "name": "Jalgaon Banana Export Consortium", "crops": ["banana"], "distance_km": 18.2, "price_offer": 26.0, "phone": "+91 97655 12040"},
    {"id": "b3", "name": "Valsad Horticulture FPO Hub", "crops": ["mango"], "distance_km": 12.0, "price_offer": 62.0, "phone": "+91 98980 55122"},
]

SEED_COLD_STORAGE = [
    {"id": "cs1", "name": "Sahyadri Cold Chain & Pre-cooling Centre", "crops": ["tomato", "mango"], "distance_km": 16.0, "rate_per_day": 3.5, "phone": "+91 98229 99011"},
    {"id": "cs2", "name": "MahaFresh Banana Controlled Atmosphere Store", "crops": ["banana"], "distance_km": 21.0, "rate_per_day": 4.0, "phone": "+91 94234 56789"},
]

SEED_PROCESSORS = [
    {"id": "p1", "name": "Sahyadri Agro Puree & Pulp Mill", "crops": ["tomato"], "distance_km": 22.0, "process_type": "Tomato Paste & Puree", "price_offer": 18.0, "phone": "+91 98224 77123"},
    {"id": "p2", "name": "Desai Fruit Pulping Mill", "crops": ["mango"], "distance_km": 19.5, "process_type": "Aseptic Mango Pulp", "price_offer": 42.0, "phone": "+91 98981 12344"},
]

def generate_recommendation(crop: str, risk: str, shelf_life: float, quantity_kg: float) -> Dict[str, Any]:
    buyer = next((b for b in SEED_BUYERS if crop in b["crops"]), SEED_BUYERS[0])
    cold_store = next((cs for cs in SEED_COLD_STORAGE if crop in cs["crops"]), None)
    processor = next((p for p in SEED_PROCESSORS if crop in p["crops"]), None)

    if risk == "HIGH":
        action = "SELL_NOW"
        price = buyer["price_offer"]
        title = {
            "en": f"URGENT: Sell Today to {buyer['name']}",
            "hi": f"तत्काल बिक्री: आज ही {buyer['name']} को बेचें",
            "gu": f"તાત્કાલિક વેચાણ: આજે જ {buyer['name']} ને વેચો"
        }
        reason = {
            "en": f"High spoilage risk (only {shelf_life} days remaining). Sell to {buyer['name']} ({buyer['distance_km']} km away) at ₹{price}/kg to prevent total spoilage loss.",
            "hi": f"सड़न का अत्यधिक खतरा है (केवल {shelf_life} दिन बचे हैं)। {buyer['distance_km']} किमी दूर ₹{price}/किलो पर तुरंत बेचें।",
            "gu": f"બગાડનું ઊંચું જોખમ. માત્ર {shelf_life} દિવસ બાકી છે. તાત્કાલિક વેચાણ કરો."
        }
        nearest = buyer
    elif risk == "MEDIUM" and cold_store and crop != "tomato":
        action = "STORE_AND_WAIT"
        price = round(buyer["price_offer"] * 1.25, 1)
        title = {
            "en": f"Store at {cold_store['name']} & Wait for Better Price",
            "hi": f"{cold_store['name']} में रखें और भाव बढ़ने की प्रतीक्षा करें",
            "gu": f"{cold_store['name']} માં સંગ્રહ કરો"
        }
        reason = {
            "en": f"Produce is firm. Market trend is UP. Storing at ₹{cold_store['rate_per_day']}/crate/day yields an expected 25% price gain in 6-8 days.",
            "hi": f"गुणवत्ता अच्छी है। कोल्ड स्टोर में रखने से 25% अधिक भाव मिलने की संभावना है।",
            "gu": f"કોલ્ડ સ્ટોરેજમાં રાખવાથી વધુ ભાવ મળશે."
        }
        nearest = cold_store
    else:
        action = "MONITOR_LOCAL"
        price = buyer["price_offer"]
        title = {
            "en": "Monitor Mandi Rates & Maintain Shaded Storage",
            "hi": "मंडी भाव पर नजर रखें और छायादार स्थान पर रखें",
            "gu": "મંડી ભાવ પર નજર રાખો"
        }
        reason = {
            "en": f"Safe condition ({shelf_life} days shelf life). No distress sale needed.",
            "hi": f"सुरक्षित स्थिति है। जल्दबाजी में कम भाव पर न बेचें।",
            "gu": f"સલામત સ્થિતિ છે."
        }
        nearest = buyer

    total_val = round(quantity_kg * price)
    loss_avoided = total_val if risk == "HIGH" else round(total_val * 0.4)

    return {
        "action": action,
        "title": title,
        "reason": reason,
        "suggested_selling_window_days": 1 if risk == "HIGH" else (7 if action == "STORE_AND_WAIT" else 4),
        "estimated_price_per_kg": price,
        "estimated_total_earnings_inr": total_val,
        "potential_loss_avoided_inr": loss_avoided,
        "nearest_entity": nearest,
        "requires_fpo_verification": risk == "HIGH" or quantity_kg > 1500
    }
