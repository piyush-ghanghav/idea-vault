from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq
import json
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
app = FastAPI(title="IdeaVault AI Worker")

class EnrichmentRequest(BaseModel):
    ideaId: str
    title: str
    rawDump: str
    domain: str

class EnrichmentResponse(BaseModel):
    ideaId: str
    category: str
    summary: str
    viabilityNote: str
    phases: list
    estimatedHours: int
    nextSteps: list
    domainMeta: dict

DOMAIN_PROMPTS = {
    "DEV": "This is a software/development idea. Focus on technical feasibility, tech stack suggestions, and implementation phases.",
    "BUSINESS": "This is a business idea. Focus on market opportunity, target users, revenue model, and go-to-market.",
    "CREATIVE": "This is a creative idea. Focus on medium, audience, style, and production steps.",
    "HEALTH": "This is a health/fitness idea. Focus on habit formation, measurable outcomes, and safety considerations.",
    "TRAVEL": "This is a travel idea. Focus on logistics, budget estimation, best timing, and must-do experiences.",
    "LEARNING": "This is a learning goal. Focus on resources, learning path, time commitment, and milestones.",
    "LIFE": "This is a personal life idea. Focus on impact, effort required, and actionable first steps.",
}

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

@app.post("/enrich", response_model=EnrichmentResponse)
def enrich_idea(req: EnrichmentRequest):
    domain_context = DOMAIN_PROMPTS.get(req.domain, "")

    prompt = f"""You are an expert idea analyst. Analyze this idea and return a structured JSON response.

Domain context: {domain_context}

Idea Title: {req.title}
Raw Idea Dump: {req.rawDump}

Return ONLY valid JSON with this exact structure, no markdown, no backticks, no extra text:
{{
  "category": "one specific category label",
  "summary": "2-3 sentence clear summary of what this idea actually is",
  "viabilityNote": "honest 2-3 sentence assessment of feasibility and key challenges",
  "phases": [
    {{"phase": "MVP", "description": "what the minimum version looks like", "duration": "estimated time"}},
    {{"phase": "V1", "description": "first full version", "duration": "estimated time"}},
    {{"phase": "V2", "description": "mature version", "duration": "estimated time"}}
  ],
  "estimatedHours": 40,
  "nextSteps": [
    "First concrete action to take",
    "Second concrete action",
    "Third concrete action"
  ],
  "domainMeta": {{
    "key_insight": "one important domain-specific insight about this idea"
  }}
}}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1000,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown code blocks if model adds them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        parsed = json.loads(raw)
        return EnrichmentResponse(ideaId=req.ideaId, **parsed)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")
