import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/auth'
import { enrichmentQueue } from '../queue'
import { cache } from '../lib/cache'

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
}
