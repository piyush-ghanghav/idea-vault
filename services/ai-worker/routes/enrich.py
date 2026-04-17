from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from lib.embed_model import embed_model
from lib.ai_service import enrich_with_ai
from utils.sanitization import sanitize_for_prompt

router = APIRouter()


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
    embedding: list[float]


@router.post("/enrich", response_model=EnrichmentResponse)
def enrich_idea(req: EnrichmentRequest):
    try:
        clean_title = sanitize_for_prompt(req.title)
        clean_dump = sanitize_for_prompt(req.rawDump)

        parsed = enrich_with_ai(clean_title, clean_dump, req.domain)

        text_to_embed = f"{req.title}\n{req.rawDump}"
        vectors = list(embed_model.embed([text_to_embed[:2000]]))
        embedding = vectors[0].tolist()

        return EnrichmentResponse(
            ideaId=req.ideaId,
            embedding=embedding,
            **parsed
        )

    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")