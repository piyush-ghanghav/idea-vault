import json
from lib.groq_client import client
from prompts.domain_prompts import DOMAIN_PROMPTS


def enrich_with_ai(title: str, raw_dump: str, domain: str):
    domain_context = DOMAIN_PROMPTS.get(domain, "")

    prompt = f"""You are an expert idea analyst. Analyze this idea and return a structured JSON response.

Domain context: {domain_context}

Idea Title: {title}
Raw Idea Dump: {raw_dump}

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

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    raw = raw.strip()

    return json.loads(raw)

def generate_focus_with_ai(prompt: str):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=400,
    )

    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    raw = raw.strip()

    return json.loads(raw)