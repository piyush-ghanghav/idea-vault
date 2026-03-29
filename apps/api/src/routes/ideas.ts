import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/auth'
import { Enrichment } from '@idea-vault/types';
import { types } from 'util'

export async function ideasRoutes(fastify: FastifyInstance) {

  fastify.get('/ideas', { preHandler: authenticate }, async (request, reply) => {
    const { cursor, limit = '10', domain } = request.query as {
      cursor?: string; limit?: string; domain?: string
    }
    const take = Math.min(parseInt(limit), 50)
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
    return reply.send({ data, nextCursor, hasNextPage })
  })

  fastify.post('/ideas', { preHandler: authenticate }, async (request, reply) => {
    const { title, rawDump, domain } = request.body as {
      title: string; rawDump: string; domain: string
    }
    if (!title || !rawDump || !domain) {
      return reply.status(400).send({ error: 'title, rawDump, and domain are required' })
    }
    const idea = await prisma.idea.create({
      data: { userId: request.userId, title, rawDump, domain: domain as any }
    })

    // call AI worker to enrich the idea
    try {
      const aiResponse = await fetch(`${process.env.AI_WORKER_URL}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: idea.id, title, rawDump, domain }),
        signal: AbortSignal.timeout(60000), // 60 seconds timeout
      })
      if (aiResponse.ok) {
        const enrichment = await aiResponse.json() as Enrichment

        await prisma.enrichment.create({
          data: {
            ideaId: idea.id,
            category: enrichment.category,
            summary: enrichment.summary,
            viabilityNote: enrichment.viabilityNote,
            phases: enrichment.phases,
            estimatedHours: enrichment.estimatedHours,
            nextSteps: enrichment.nextSteps,
            domainMeta: enrichment.domainMeta,
          }
        })

        await prisma.idea.update({
          where: { id: idea.id },
          data: { status: 'ENRICHED' }
        })
      }
    } catch (error) {
      console.error('Error enriching idea:', error)
      // We don't fail the request if enrichment fails, we just log the error
    }
    const ideaWithEnrichment = await prisma.idea.findUnique({
      where: { id: idea.id },
      include: { enrichment: true }
    })
    return reply.status(201).send(ideaWithEnrichment)
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
    return reply.send(idea)
  })

  fastify.delete('/ideas/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.idea.findFirst({ where: { id, userId: request.userId } })
    if (!existing) return reply.status(404).send({ error: 'Idea not found' })
    await prisma.idea.delete({ where: { id } })
    return reply.status(204).send()
  })
}
