from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime

CropType = Literal["tomato", "banana", "mango"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]
ActionType = Literal["SELL_NOW", "STORE_AND_WAIT", "PROCESS_VALUE_ADD", "MONITOR_LOCAL"]
StorageType = Literal["ambient_open", "ambient_crates", "ambient_bags", "evaporative_cooler", "cold_storage"]

class SpoilageInputSchema(BaseModel):
    crop: CropType
    days_since_harvest: int = Field(ge=0, default=1)
    temperature_c: float = Field(default=32.0)
    humidity_pct: float = Field(default=55.0)
    storage_type: StorageType = "ambient_crates"
    transit_time_hours: float = 0.0
    ripeness_stage: Optional[str] = "breaker_turning"
    surface_damage_pct: float = 0.0

class PredictionOutputSchema(BaseModel):
    crop: CropType
    remaining_shelf_life_days: float
    risk_level: RiskLevel
    confidence: float
    model_version: str
    feature_impacts: Dict[str, float]

class RecommendationOutputSchema(BaseModel):
    action: ActionType
    title: Dict[str, str]
    reason: Dict[str, str]
    suggested_selling_window_days: int
    estimated_price_per_kg: float
    estimated_total_earnings_inr: float
    potential_loss_avoided_inr: float
    nearest_entity: Optional[Dict[str, Any]] = None
    requires_fpo_verification: bool

class WhatsAppWebhookPayload(BaseModel):
    from_phone: str
    sender_name: Optional[str] = "Farmer"
    text: Optional[str] = None
    audio_base64: Optional[str] = None
    image_base64: Optional[str] = None
    language: Optional[str] = "hi"
