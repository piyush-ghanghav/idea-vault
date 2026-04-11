from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from lib.embed_model import embed_model

router = APIRouter()

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: list[float]

@router.post("/embed", response_model=EmbedResponse)
def generate_embedding(req: EmbedRequest):
    try:
        vectors = list(model.embed([req.text[:2000]]))
        return EmbedResponse(embedding=vectors[0].tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")
