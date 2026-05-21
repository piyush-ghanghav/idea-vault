from fastapi import FastAPI
from datetime import datetime

from routes.enrich import router as enrich_router
from routes.focus import router as focus_router
from routes.embed import router as embed_router

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositePropagator
from opentelemetry.trace.propagation.tracecontext import (
    TraceContextTextMapPropagator,
)
from opentelemetry.propagators.b3 import B3MultiFormat

# ---- FastAPI app ----

app = FastAPI(title="IdeaVault AI Worker")

# ---- OpenTelemetry setup ----

resource = Resource.create({
    "service.name": "ideavault-ai-worker"
})

provider = TracerProvider(resource=resource)

exporter = OTLPSpanExporter(
    endpoint="http://localhost:4318/v1/traces"
)

provider.add_span_processor(
    BatchSpanProcessor(exporter)
)

trace.set_tracer_provider(provider)

# Accept trace headers from Node.js
set_global_textmap(
    CompositePropagator([
        TraceContextTextMapPropagator(),
        B3MultiFormat(),
    ])
)

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# ---- Routes ----

@app.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat()
    }

app.include_router(enrich_router)
app.include_router(focus_router)
app.include_router(embed_router)