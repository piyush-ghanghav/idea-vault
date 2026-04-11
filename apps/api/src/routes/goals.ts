import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/auth'
import { calculateNextReview } from '../lib/sm2'
import { z } from 'zod'

const CreateGoalSchema = z.object({
  title: z.string().min(1),
  why: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
})

const ReviewGoalSchema = z.object({
  quality: z.number().int().min(0).max(5),
})

export async function goalsRoutes(fastify: FastifyInstance) {

  fastify.get('/goals', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId

    const goals = await prisma.learningGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ goals })
  })

  fastify.post('/goals', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId
    const body = CreateGoalSchema.parse(request.body)

    const goal = await prisma.learningGoal.create({
      data: {
        userId,
        title: body.title,
        why: body.why,
        estimatedHours: body.estimatedHours,
        nextReviewAt: new Date(),
      },
    })

    return reply.status(201).send({ goal })
  })

  fastify.patch('/goals/:id', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId
    const { id } = request.params as { id: string }
    const body = CreateGoalSchema.partial().parse(request.body)

    const goal = await prisma.learningGoal.findFirst({ where: { id, userId } })
    if (!goal) return reply.status(404).send({ error: 'Not found' })

    const updated = await prisma.learningGoal.update({
      where: { id },
      data: body,
    })

    return reply.send({ goal: updated })
  })

  fastify.delete('/goals/:id', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId
    const { id } = request.params as { id: string }

    const goal = await prisma.learningGoal.findFirst({ where: { id, userId } })
    if (!goal) return reply.status(404).send({ error: 'Not found' })

    await prisma.learningGoal.delete({ where: { id } })
    return reply.status(204).send()
  })

  fastify.post('/goals/:id/review', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId
    const { id } = request.params as { id: string }
    const { quality } = ReviewGoalSchema.parse(request.body)

    const goal = await prisma.learningGoal.findFirst({ where: { id, userId } })
    if (!goal) return reply.status(404).send({ error: 'Not found' })

    const next = calculateNextReview({
      quality,
      repetitions: goal.repetitions,
      easeFactor: goal.easeFactor,
      interval: goal.interval,
    })


    const updated = await prisma.learningGoal.update({
      where: { id },
      data: {
        repetitions: next.repetitions,
        easeFactor: next.easeFactor,
        interval: next.interval,
        nextReviewAt: next.nextReviewAt,
        lastReviewedAt: new Date(),
        status: quality >= 3 ? 'ACTIVE' : 'QUEUED',
      },
    })

    return reply.send({ goal: updated, nextReviewAt: next.nextReviewAt })
  })
}