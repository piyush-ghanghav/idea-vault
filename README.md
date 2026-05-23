![Node](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat&logo=python&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat&logo=redis&logoColor=white)

# IdeaVault

A personal clarity OS for capturing, enriching, and connecting ideas across every domain of your life.

Ideas are saved instantly. AI enrichment runs asynchronously in the background. Semantic similarity surfaces connections you would have missed. A spaced repetition system resurfaces learning goals when your mind has space for them.

---
## Demo

![Dashboard](docs/demo.gif)

<!-- Record with: open app, create idea, watch enrichment appear live, open graph -->
<!-- Tool: any screen recorder, convert to GIF with ezgif.com, keep under 5MB -->

## What it does

You paste a raw, unstructured idea dump. The system saves it immediately (~80ms), then a background worker sends it to a Groq-powered AI service that produces a structured enrichment: category, summary, viability note, phases, next steps, and domain-specific metadata. The enriched idea appears in your dashboard in real time via WebSocket — no refresh required.

Each idea is also embedded as a 384-dimensional vector using a local embedding model. This powers semantic similarity search: "you had a similar idea 3 months ago" surfaces automatically when two ideas cross a 0.88 cosine similarity threshold.

A weekly focus module applies The One Thing principle: given your active ideas, learning goals, available hours, and energy level, the system recommends exactly one thing to focus on this week.

Learning goals use the SM-2 spaced repetition algorithm. A daily background job checks cognitive load (proxied by recent idea activity) and surfaces due goals only when the user has mental space — not as noise.

---

## Architecture

Three services, one monorepo, one Docker network.

**Next.js 16** (frontend) — App Router, client components for interactive state, Clerk for auth session management.

**Fastify 5** (API, port 3001) — REST endpoints, Clerk JWT verification on every protected route, Redis cache-aside on the ideas list, BullMQ job enqueueing on idea create, Socket.io server (port 3002) for real-time enrichment push.

**Python FastAPI** (AI worker, port 8000) — Groq Llama 3.3 70B for enrichment, fastembed with BAAI/bge-small-en-v1.5 for local 384-dim embeddings, domain-specific system prompts, prompt injection sanitization.

**Node worker** (separate process) — picks BullMQ jobs from Redis, calls Python AI service, saves enrichment and embedding to Postgres, invalidates Redis cache, publishes enrichment complete event to Redis pub/sub.

**Postgres 16 + pgvector** — ideas, enrichments, learning goals, weekly checkins. Vector column on ideas table for cosine similarity queries via the `<=>` operator.

**Redis 7** — BullMQ job storage, cache-aside for ideas list (5-min TTL), pub/sub bridge between Node worker and Socket.io server.

**Jaeger** — OpenTelemetry distributed tracing. Trace context propagates from Node worker to Python AI service via W3C `traceparent` header. Both services appear as one connected trace.

---

## Key technical decisions

**Separate Enrichment table from Idea table.** Idea is user data. Enrichment is computed data. Separating them means dashboard list queries don't join enrichment unnecessarily, and enrichment can be regenerated without touching the core idea row.

**BullMQ over synchronous AI calls.** The first version called Groq synchronously — request time went from 20ms to 2200ms. Under concurrent load this exhausts the connection pool. BullMQ decouples creation from enrichment: idea saves in ~80ms, worker picks up the job independently.

**Redis pub/sub as bridge between worker and Socket.io.** Worker and API are separate processes — they cannot share memory. The worker publishes to a Redis channel; the API server subscribes and emits to the correct Socket.io room. This keeps them decoupled without adding another queue.

**pgvector over a dedicated vector database.** At current scale (thousands of ideas), Postgres with pgvector handles similarity queries in under 20ms. Simpler operationally — one less service, one less connection, migrations in the same schema. Migration path to Pinecone or Weaviate is straightforward when vector count approaches 500k-1M.

**fastembed for local embeddings.** OpenAI's embedding API costs money and adds an external dependency. fastembed runs BAAI/bge-small-en-v1.5 locally on CPU — zero cost, 384-dim vectors, ~50MB model, loads once at startup.

**SM-2 as a pure function.** The spaced repetition algorithm is implemented as `SM2Input -> SM2Output` with no side effects. Algorithm state lives in Postgres. The function is trivially unit testable without mocking anything.

**Token bucket rate limiting in Redis.** `INCR` + `EXPIRE` on first request. Fixed window rate limiting has a boundary edge case: a user can make 10 requests at 11:59pm and 10 at 12:00am — 20 in two minutes. Token bucket smooths this. State lives in Redis so it works across multiple API instances.

**Per-route preHandler for auth instead of a global hook.** Fastify uses plugin encapsulation — hooks registered in one plugin scope don't apply to routes in sibling scopes. A global hook silently failed during development. Per-route preHandler is explicit and predictable.

**OpenTelemetry distributed tracing.** When something breaks across Node -> Redis -> Python -> Groq, logs across two services are hard to correlate. W3C `traceparent` header carries traceId + spanId from Node worker to Python service. Both export spans to Jaeger. One request, one timeline.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, Clerk |
| API | Fastify 5, TypeScript, Zod, Socket.io 4 |
| Queue | BullMQ 5, Redis 7 |
| AI service | Python 3.10, FastAPI, Groq (Llama 3.3 70B) |
| Embeddings | fastembed 0.8, BAAI/bge-small-en-v1.5 (local, 384-dim) |
| Database | PostgreSQL 16, pgvector, Prisma 7 |
| Tracing | OpenTelemetry, Jaeger |
| Auth | Clerk (JWT verification in Fastify middleware) |
| Graph | React Flow 11 |

---

## Links

- Live demo: Coming soon
<!-- - Live demo: [ideavault.app](https://ideavault.app) add when deployed -->
- Decision log: [DECISION_LOG.md](./DECISION_LOG.md)
- Architecture diagram: [docs/architecture.svg](./docs/architecture.svg)

## Running locally

Prerequisites: Docker, Node.js 20, Python 3.10, pnpm.

```bash
# Start Postgres, Redis, Jaeger
docker compose up -d

# Install dependencies
pnpm install

# Run database migrations
cd apps/api && npx prisma migrate dev

# Start all services (separate terminals)
pnpm --filter api dev          # Fastify API on :3001
pnpm --filter api worker       # Node enrichment worker
pnpm --filter api review-worker # Goal review cron worker
pnpm --filter web dev          # Next.js on :3000

# Python AI worker
cd services/ai-worker
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Environment variables required: `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `GROQ_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `AI_WORKER_URL`.

Copy `.env.example` to `.env` in each app directory and fill in your values.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp services/ai-worker/.env.example services/ai-worker/.env
```
---

## Project structure

```
idea-vault/
  apps/
    api/          Fastify API + Node worker
    web/          Next.js frontend
  services/
    ai-worker/    Python FastAPI AI service
  packages/
    types/        Shared TypeScript types
```

---

## Decision log

27 documented architectural decisions covering schema design, queue patterns, caching strategy, embedding model choice, rate limiting algorithm, distributed tracing, and more. Each entry follows the format: what was built, alternatives considered, why this choice, what changes at 10x scale.

---

Built by Piyush — [GitHub](https://github.com/piyush-ghanghav) · [LinkedIn](https://linkedin.com/in/piyush-ghanghav)