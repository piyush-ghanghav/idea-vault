import fastify, { FastifyInstance } from "fastify"
import { authenticate } from "../plugins/auth"
import { prisma } from "../lib/prisma"
import { FocusRecSchema } from "../schemas/enrichment"

export function focusRoutes(fastify: FastifyInstance) {

    fastify.get('/focus/checkin', { preHandler: authenticate }, async (request, reply) => {
        const weekStart = getWeekStart()
        const checkin = await prisma.weeklyCheckin.findFirst({
            where: {
                userId: request.userId,
                weekStart: weekStart
            }
        })
        return reply.send(checkin ?? null)
    })


    fastify.post('/focus/checkin', { preHandler: authenticate }, async (request, reply) => {
        const { availableHours, energyLevel, domainLeaning } = request.body as { availableHours: number, energyLevel: number, domainLeaning?: string }

        if (availableHours == null || energyLevel == null) {
            return reply.status(400).send({ error: 'availableHours and energyLevel are required' })
        }

        const weekStart = getWeekStart()
        const existing = await prisma.weeklyCheckin.findFirst({
            where: {
                userId: request.userId,
                weekStart: { gte: weekStart }
            }
        })

        if (existing) {
            return reply.send(existing)
        }

        const [activeIdeas, learningGoals] = await Promise.all([
            prisma.idea.findMany({
                where: {
                    userId: request.userId,
                    status: { in: ['PENDING', 'ENRICHED', 'ACTIVE'] }
                },
                include: { enrichment: true },
                orderBy: { updatedAt: 'desc' },
                take: 10

            }),

            prisma.learningGoal.findMany({
                where: { userId: request.userId, status: { in: ['QUEUED', 'ACTIVE'] } },
                take: 5,
            })
        ])

        const aiResponse = await fetch(
            `${process.env.AI_WORKER_URL ?? 'http://localhost:8000'}/focus`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    availableHours,
                    energyLevel,
                    domainLeaning: domainLeaning ?? null,
                    ideas: activeIdeas.map(i => ({
                        title: i.title,
                        domain: i.domain,
                        summary: i.enrichment?.summary ?? null
                    })),
                    goals: learningGoals.map(g => ({ title: g.title }))
                }),
                signal: AbortSignal.timeout(30000),
            }
        )
        if (!aiResponse.ok) {
            return reply.status(500).send({ error: 'Focus generation failed' })
        }
        const raw = await aiResponse.json()

        let focusRec: any
        try {
            focusRec = FocusRecSchema.parse(raw)
        } catch (err) {
            console.error('Focus rec validation failed:', err)
            focusRec = {
                focus: 'Review your active ideas',
                rationale: 'Take time this week to reflect on your priorities and pick one to move forward.',
                firstAction: 'Open IdeaVault and mark one idea as Active.'
            }
        }

        const checkin = await prisma.weeklyCheckin.create({
            data: {
                userId: request.userId,
                availableHours,
                energyLevel,
                domainLeaning: domainLeaning as any ?? null,
                focusRec: JSON.stringify(focusRec),
                weekStart,
            }
        })

        return reply.status(201).send({ ...checkin, focusRec })

    })

}


function getWeekStart(): Date {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day
    const weekStart = new Date(now.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)

    return weekStart
}