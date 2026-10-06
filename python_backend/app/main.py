"""
HarvestSaver AI - FastAPI Main Application
Provides production REST API & WhatsApp Webhook endpoints
"""

from fastapi import FastAPI, HTTPException, Query
from typing import Optional, List
import datetime

from app.schemas import (
    SpoilageInputSchema,
    PredictionOutputSchema,
    RecommendationOutputSchema,
    WhatsAppWebhookPayload,
)
from app.ml_model import model_instance
from app.recommendations import generate_recommendation, SEED_BUYERS, SEED_COLD_STORAGE, SEED_PROCESSORS

app = FastAPI(
    title="HarvestSaver AI",
    description="AI advisor helping smallholder farmers prevent post-harvest food loss before it spoils.",
    version="1.0.0"
)

# In-memory storage for pilot demonstrations
in_memory_reports = []
in_memory_feedback = []

@app.get("/")
def root():
    return {
        "message": "HarvestSaver AI Engine Online",
        "tagline": "Save harvest before it spoils (SDG 2 Zero Hunger, SDG 12.3)",
        "docs_url": "/docs"
    }

@app.post("/api/predict", response_model=PredictionOutputSchema)
def predict_spoilage(input_data: SpoilageInputSchema):
    result = model_instance.predict(
        crop=input_data.crop,
        days=input_data.days_since_harvest,
        temp=input_data.temperature_c,
        humidity=input_data.humidity_pct,
        storage=input_data.storage_type,
        damage_pct=input_data.surface_damage_pct
    )
    return result

@app.post("/api/recommend", response_model=RecommendationOutputSchema)
def get_recommendation(crop: str, risk: str, shelf_life: float, quantity_kg: float = 1000.0):
    return generate_recommendation(crop=crop, risk=risk, shelf_life=shelf_life, quantity_kg=quantity_kg)

@app.get("/api/buyers")
def list_buyers(crop: Optional[str] = None):
    if crop:
        return [b for b in SEED_BUYERS if crop in b["crops"]]
    return SEED_BUYERS

@app.get("/api/storage")
def list_cold_storage(crop: Optional[str] = None):
    if crop:
        return [cs for cs in SEED_COLD_STORAGE if crop in cs["crops"]]
    return SEED_COLD_STORAGE

@app.get("/api/processors")
def list_processors(crop: Optional[str] = None):
    if crop:
        return [p for p in SEED_PROCESSORS if crop in p["crops"]]
    return SEED_PROCESSORS

@app.post("/webhook/whatsapp")
def whatsapp_webhook(payload: WhatsAppWebhookPayload):
    # Mock / Provider-agnostic WhatsApp webhook
    text = (payload.text or "").lower()
    
    # NLP extraction
    crop = "tomato"
    if "banana" in text or "kela" in text:
        crop = "banana"
    elif "mango" in text or "aam" in text or "keri" in text:
        crop = "mango"
        
    days = 3 if "3" in text else 1
    temp = 34.0 if "garmi" in text or "heat" in text else 30.0

    prediction = model_instance.predict(crop=crop, days=days, temp=temp, humidity=50.0, storage="ambient_crates")
    rec = generate_recommendation(crop=crop, risk=prediction["risk_level"], shelf_life=prediction["remaining_shelf_life_days"], quantity_kg=1200.0)

    lang = payload.language or "hi"
    title_text = rec["title"].get(lang, rec["title"]["en"])
    reason_text = rec["reason"].get(lang, rec["reason"]["en"])

    whatsapp_reply = (
        f"🌾 *HarvestSaver AI Advisory*\n\n"
        f"Risk Level: {prediction['risk_level']}\n"
        f"Remaining Shelf Life: {prediction['remaining_shelf_life_days']} days\n\n"
        f"Action: {title_text}\n"
        f"Reason: {reason_text}\n"
        f"Contact: {rec['nearest_entity']['name']} ({rec['nearest_entity']['phone']})"
    )

    return {
        "status": "delivered",
        "reply_text": whatsapp_reply,
        "prediction": prediction,
        "recommendation": rec
    }

@app.get("/api/admin/dashboard")
def admin_dashboard():
    return {
        "metrics": {
            "total_harvest_kg": 6050,
            "spoilage_prevented_kg": 4200,
            "loss_reduction_pct": 69.4,
            "active_farmers": 3,
            "sdg_target_12_3_score": "On Track (-25% food loss achieved)"
        },
        "recent_alerts": [
            {"farmer": "Ramesh Patel", "crop": "tomato", "risk": "HIGH", "action": "SELL_NOW", "verified": True},
            {"farmer": "Suresh Patil", "crop": "banana", "risk": "MEDIUM", "action": "STORE_AND_WAIT", "verified": True},
            {"farmer": "Bhavna Desai", "crop": "mango", "risk": "HIGH", "action": "PROCESS_VALUE_ADD", "verified": False}
        ]
    }
