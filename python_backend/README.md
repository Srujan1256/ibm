# HarvestSaver AI - Python FastAPI Backend & ML Engine

**Tagline:** An AI advisor that helps small farmers save their harvest before it spoils.  
**Goals:** SDG 2 Zero Hunger | SDG Target 12.3 Food Loss Reduction.  
**Target Crops:** Tomato, Banana, Mango.  
**Languages:** Hindi, Gujarati, English.  

---

## Architecture Overview
1. **Language Layer:** Multilingual NLP entity extractor (Hindi, Gujarati, English) + Whisper/Gemini audio transcription adapter.
2. **ML Spoilage Model:** Random Forest & post-harvest physiological degradation kinetics ($Q_{10}$ temperature coefficient, storage multipliers, ethylene sensitivity).
3. **Recommendation Engine:** Rule-based & data-backed matcher linking farmers to local APMC buyers, cold storage facilities, and food processing plants.
4. **WhatsApp Webhook:** Cloud API compatible handler supporting voice notes, images, and text.
5. **Human-in-the-Loop Safeguard:** FPO field agent verification workflow for high-risk alerts before farmer dispatch.

---

## Quickstart Instructions

### 1. Run with Python 3.11+
```bash
cd python_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Open interactive Swagger API docs at `http://localhost:8000/docs`.

### 2. Run the Tomato Farmer Demo Simulation
```bash
python demo_script.py
```

### 3. Run Test Suite
```bash
python -m unittest tests/test_spoilage.py
```

### 4. Run with Docker
```bash
docker build -t harvestsaver-ai .
docker run -p 8000:8000 harvestsaver-ai
```
