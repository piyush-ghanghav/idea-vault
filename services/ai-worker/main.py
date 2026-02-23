from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="IdeaVault AI Worker")

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
