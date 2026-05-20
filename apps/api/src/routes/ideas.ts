import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/auth'
import { enrichmentQueue } from '../queue'
import { cache } from '../lib/cache'
import {redis} from '../queue'

const RATE_LIMIT = {
  max: 10,
  windowSec: 3600,
}

async function checkRateLimit(userId: string):Promise<{allowed:boolean, remaining:number}> {
  const key = `ratelimit:enrichment:${userId}`
  const count = await redis.incr(key)

  if(count === 1){
    await redis.expire(key, RATE_LIMIT.windowSec)
  }

  const allowed = count <=RATE_LIMIT.max
  const remaining = Math.max(0, RATE_LIMIT.max-count)

  return {allowed, remaining}
}

export async function ideasRoutes(fastify: FastifyInstance) {

  fastify.get('/ideas', { preHandler: authenticate }, async (request, reply) => {
    const { cursor, limit = '10', domain } = request.query as {
      cursor?: string; limit?: string; domain?: string
    }
    const take = Math.min(parseInt(limit), 50)

    const isDefaultQuery = !cursor && !domain && take == 10

    if (isDefaultQuery) {
      const cached = await cache.getIdeas(request.userId)
      if (cached) {
        return reply.send(cached)
      }
    }

    const ideas = await prisma.idea.findMany({
      where: { userId: request.userId, ...(domain && { domain: domain as any }) },
      include: { enrichment: true },
      take: take + 1,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: 'desc' },
    })
    const hasNextPage = ideas.length > take
    const data = hasNextPage ? ideas.slice(0, -1) : ideas
    const nextCursor = hasNextPage ? data[data.length - 1].id : null
    const result = { data, nextCursor, hasNextPage }
    if (isDefaultQuery) {
      await cache.setIdeas(request.userId, result)
    }
    return reply.send(result)
  })

  fastify.post('/ideas', { preHandler: authenticate }, async (request, reply) => {
    const { title, rawDump, domain } = request.body as {
      title: string; rawDump: string; domain: string
    }
    if (!title || !rawDump || !domain) {
      return reply.status(400).send({ error: 'title, rawDump, and domain are required' })
    }

    const {allowed, remaining} = await checkRateLimit(request.userId)

    if(!allowed){
      return reply.status(429).send({
        error: 'Rate limit exceeded',
        message: 'Maximum 10 AI enrichments per hour',
        retryAfter: RATE_LIMIT.windowSec
      })
    }
  
    const idea = await prisma.idea.create({
      data: { userId: request.userId, title, rawDump, domain: domain as any }
    })
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { clerkId: true }
    })

    await enrichmentQueue.add('enrich', {
      ideaId: idea.id,
      userId: idea.userId,
      clerkId: user!.clerkId,
      title,
      rawDump,
      domain,
    })
    await cache.invalidateIdeas(request.userId)

    console.log(`[API] Queued enrichment job for idea ${idea.id}`)
    return reply.status(201).send({ ...idea, enrichment: null })
  })

  fastify.get('/ideas/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const idea = await prisma.idea.findFirst({
      where: { id, userId: request.userId },
      include: { enrichment: true },
    })
    if (!idea) return reply.status(404).send({ error: 'Idea not found' })
    return reply.send(idea)
  })

  fastify.patch('/ideas/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { title, status } = request.body as { title?: string; status?: string }
    const existing = await prisma.idea.findFirst({ where: { id, userId: request.userId } })
    if (!existing) return reply.status(404).send({ error: 'Idea not found' })
    const idea = await prisma.idea.update({
      where: { id },
      data: { ...(title && { title }), ...(status && { status: status as any }) }
    })
    await cache.invalidateIdeas(request.userId)
    return reply.send(idea)
  })

  fastify.delete('/ideas/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.idea.findFirst({ where: { id, userId: request.userId } })
    if (!existing) return reply.status(404).send({ error: 'Idea not found' })
    await prisma.idea.delete({ where: { id } })
    await cache.invalidateIdeas(request.userId)
    return reply.status(204).send()
  })

  fastify.get('/ideas/:id/similar', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const idea = await prisma.idea.findFirst({
      where: { id, userId: request.userId }
    })
    if (!idea) return reply.status(404).send({ error: 'Idea not found' })

    const embeddingCheck = await prisma.$queryRaw<{ has_embedding: boolean }[]>`
      SELECT (embedding IS NOT NULL) AS has_embedding FROM "Idea" WHERE id = ${id}
    `
    if (!embeddingCheck[0]?.has_embedding) {
      return reply.send({ similar: [] })
    }

    const similar = await prisma.$queryRaw<{
      id: string
      title: string
      domain: string
      createdAt: Date
      similarity: number
    }[]>`
      SELECT
        i.id,
        i.title,
        i.domain,
        i."createdAt",
        1 - (i.embedding <=> (
          SELECT embedding FROM "Idea" WHERE id = ${id}
        )) AS similarity
      FROM "Idea" i
      WHERE
        i."userId" = ${request.userId}
        AND i.id != ${id}
        AND i.embedding IS NOT NULL
        AND 1 - (i.embedding <=> (
          SELECT embedding FROM "Idea" WHERE id = ${id}
        )) > 0.78
      ORDER BY similarity DESC
      LIMIT 3
    `

    return reply.send({ similar })
  })

  fastify.post('/ideas/search', { preHandler: authenticate }, async (request, reply) => {
    const { query } = request.body as { query: string }
    if (!query?.trim()) return reply.status(400).send({ error: 'query is required' })

    const embedRes = await fetch(
      `${process.env.AI_WORKER_URL ?? 'http://localhost:8000'}/embed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
        signal: AbortSignal.timeout(10000),
      }
    )
    if (!embedRes.ok) return reply.status(500).send({ error: 'Embedding failed' })

    const { embedding } = await embedRes.json() as { embedding: number[] }
    const vectorLiteral = `[${embedding.join(',')}]`

    const results = await prisma.$queryRaw<{
      id: string
      title: string
      domain: string
      createdAt: Date
      similarity: number
    }[]>`
      SELECT
        i.id,
        i.title,
        i.domain,
        i."createdAt",
        1 - (i.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "Idea" i
      WHERE
        i."userId" = ${request.userId}
        AND i.embedding IS NOT NULL
        AND 1 - (i.embedding <=> ${vectorLiteral}::vector) > 0.65
      ORDER BY similarity DESC
      LIMIT 10
    `

    return reply.send({ results })
  })
}
