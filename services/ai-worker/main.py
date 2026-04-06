from fastapi import FastAPI
from datetime import datetime

from routes.enrich import router as enrich_router
from routes.focus import router as focus_router

app = FastAPI(title="IdeaVault AI Worker")

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

app.include_router(enrich_router)
app.include_router(focus_router)    