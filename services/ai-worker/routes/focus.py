from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from lib.groq_client import client
import json

router = APIRouter()

class FocusRequest(BaseModel):
    availableHours: int
    energyLevel: int
    domainLeaning: str | None
    ideas: list
    goals: list

class FocusResponse(BaseModel):
    focus: str
    rationale: str
    firstAction: str

@router.post("/focus", response_model=FocusResponse)
def generate_focus(req: FocusRequest):
    ideas_context = "\n".join([
        f"- \"{i['title']}\" ({i['domain']}) — {i.get('summary', 'not yet enriched')}"
        for i in req.ideas
    ]) or "No active ideas"

    goals_context = "\n".join([
        f"- \"{g['title']}\""
        for g in req.goals
    ]) or "No learning goals set"

    prompt = f"""You are a productivity coach applying "The One Thing" principle.
The user's context this week:
- Available hours: {req.availableHours}
- Energy level: {req.energyLevel}/5
- Domain they're drawn to: {req.domainLeaning or 'no preference'}

Their active ideas:
{ideas_context}

Their learning goals:
{goals_context}

Based on this context, identify the ONE thing they should focus on this week.
Apply this question: "What is the one thing I can do such that by doing it, everything else becomes easier or unnecessary?"

Return ONLY valid JSON, no markdown:
{{
  "focus": "the specific idea or goal title to focus on",
  "rationale": "2 sentence explanation of why this is the one thing right now,  must be concise, no fluff",
  "firstAction": "the single most important action to take today"
}}"""

    try:
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

        parsed = json.loads(raw)
        return FocusResponse(**parsed)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Focus generation failed: {str(e)}")