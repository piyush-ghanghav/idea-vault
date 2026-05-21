// worker: pickup jobs, calls python, writes enrichment to db
import '../lib/tracing'
import '../lib/env'
import { Worker, Job } from "bullmq"
import { redis } from './index'
import { prisma } from '../lib/prisma'
import { Enrichment } from '@idea-vault/types'
import { EnrichmentSchema } from '../schemas/enrichment'
import { cache } from '../lib/cache'
import { context, propagation, trace } from '@opentelemetry/api'


interface EnrichmentJobData {
    ideaId: string
    userId: string
    clerkId: string
    title: string
    rawDump: string
    domain: string
}

const worker = new Worker<EnrichmentJobData>(
    'idea-enrichment',
    async (job: Job<EnrichmentJobData>) => {
        const { ideaId, userId, clerkId, title, rawDump, domain } = job.data

        console.log(`[Worker] Processing job ${job.id} for idea ${ideaId}`)

        const existing = await prisma.enrichment.findUnique({ where: { ideaId } })

        if (existing) {
            console.log(`[Worker] Enrichment already exists for ${ideaId}, skipping`)
            return { skipped: true }
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }
        propagation.inject(context.active(), headers)

        // Call Python AI service
        const aiResponse = await fetch(
            `${process.env.AI_WORKER_URL ?? 'http://localhost:8000'}/enrich`,
            {
                method: 'POST',
                headers,
                body: JSON.stringify({ ideaId, title, rawDump, domain }),
                signal: AbortSignal.timeout(60000),
            }
        )

        if (!aiResponse.ok) {
            const error = aiResponse.text
            throw new Error(`AI service failed ${error}`)
        }

        const rawEnrichment = await aiResponse.json() as Enrichment
        const enrichment = EnrichmentSchema.parse(rawEnrichment)

        await prisma.enrichment.upsert({
            where: { ideaId },
            create: {
                ideaId,
                category: enrichment.category,
                summary: enrichment.summary,
                viabilityNote: enrichment.viabilityNote,
                phases: enrichment.phases,
                estimatedHours: enrichment.estimatedHours,
                nextSteps: enrichment.nextSteps,
                domainMeta: (enrichment.domainMeta ?? {}) as any,
            },
            update: {
                category: enrichment.category,
                summary: enrichment.summary,
                viabilityNote: enrichment.viabilityNote,
                phases: enrichment.phases,
                estimatedHours: enrichment.estimatedHours,
                nextSteps: enrichment.nextSteps,
                domainMeta: (enrichment.domainMeta ?? {}) as any,
            }
        })

        if (enrichment.embedding && enrichment.embedding.length === 384) {
            const vectorLiteral = `[${enrichment.embedding.join(',')}]`
            await prisma.$executeRaw`
                UPDATE "Idea"
                SET embedding = ${vectorLiteral}::vector
                WHERE id = ${ideaId}
            `
            console.log(`[Worker] Embedding saved for idea ${ideaId}`)
        }


        const savedEnrichment = await prisma.enrichment.findUnique({ where: { ideaId } })

        await prisma.idea.update({
            where: { id: ideaId },
            data: { status: 'ENRICHED' }
        })

        await cache.invalidateIdeas(userId)
        console.log(`[Worker] Cache invalidated for user ${userId}`)

        await cache.publishEnrichmentComplete(clerkId, ideaId, savedEnrichment)

        console.log(`[Worker] Enrichment complete for idea ${ideaId}`)
        return { success: true, ideaId }
    },
    {
        connection: redis,
        concurrency: 3
    }
)

// Event Handlers

worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job?.id} failed:`, err.message)
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
        console.log(`[Worker] Job ${job.id} exhausted all retries — moving to DLQ`)
    }
})

worker.on('error', (err) => {
    console.log(`[Worker] Worker error:`, err)
})

console.log(`[Worker] Enrichment worker started, waiting for jobs...`)
