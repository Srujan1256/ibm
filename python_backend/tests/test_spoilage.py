"""
Unit and Integration Tests for HarvestSaver AI
Tests:
1. Spoilage prediction logic under ambient heat vs cold storage
2. Recommendation engine rules (High risk -> sell today; Medium risk -> store and wait)
3. Simulated farmer conversation flow
"""

import unittest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.ml_model import model_instance
from app.recommendations import generate_recommendation

class TestHarvestSaver(unittest.TestCase):

    def test_spoilage_prediction_ambient_heat(self):
        """Tomato after 3 days in 35C ambient crates should produce HIGH risk."""
        pred = model_instance.predict(
            crop="tomato",
            days=3,
            temp=35.0,
            humidity=50.0,
            storage="ambient_crates"
        )
        self.assertLessEqual(pred["remaining_shelf_life_days"], 2.0)
        self.assertEqual(pred["risk_level"], "HIGH")

    def test_spoilage_prediction_cold_storage(self):
        """Tomato in cold storage should have extended shelf life and LOW risk."""
        pred = model_instance.predict(
            crop="tomato",
            days=1,
            temp=13.0,
            humidity=85.0,
            storage="cold_storage"
        )
        self.assertGreater(pred["remaining_shelf_life_days"], 10.0)
        self.assertEqual(pred["risk_level"], "LOW")

    def test_recommendation_high_risk_triggers_sell_today(self):
        """High risk produce must trigger SELL_NOW to closest buyer."""
        rec = generate_recommendation(
            crop="tomato",
            risk="HIGH",
            shelf_life=1.4,
            quantity_kg=1200.0
        )
        self.assertEqual(rec["action"], "SELL_NOW")
        self.assertIsNotNone(rec["nearest_entity"])
        self.assertTrue(rec["requires_fpo_verification"])

    def test_banana_medium_risk_triggers_cold_store(self):
        """Banana with medium risk should suggest cold storage when available."""
        rec = generate_recommendation(
            crop="banana",
            risk="MEDIUM",
            shelf_life=3.2,
            quantity_kg=4000.0
        )
        self.assertEqual(rec["action"], "STORE_AND_WAIT")
        self.assertIn("Cold", rec["nearest_entity"]["name"])

    def test_simulated_conversation_flow(self):
        """End-to-end simulated conversation check."""
        pred = model_instance.predict(crop="mango", days=4, temp=34.0, humidity=60.0, storage="ambient_open", damage_pct=8.0)
        rec = generate_recommendation(crop="mango", risk=pred["risk_level"], shelf_life=pred["remaining_shelf_life_days"], quantity_kg=850.0)
        self.assertIn("title", rec)
        self.assertIn("hi", rec["title"])
        self.assertIn("gu", rec["title"])

if __name__ == "__main__":
    unittest.main()
