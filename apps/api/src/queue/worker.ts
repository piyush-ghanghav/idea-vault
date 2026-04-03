// worker: pickup jobs, calls python, writes enrichment to db
import '../lib/env'
import { Worker, Job } from "bullmq"
import { redis } from './index'
import { prisma } from '../lib/prisma'
import { Enrichment } from '@idea-vault/types'


interface EnrichmentJobData {
    ideaId: string
    title: string
    rawDump: string
    domain: string
}

const worker = new Worker<EnrichmentJobData>(
    'idea-enrichment',
    async (job: Job<EnrichmentJobData>) => {
        const { ideaId, title, rawDump, domain } = job.data

        console.log(`[Worker] Processing job ${job.id} for idea ${ideaId}`)

        const existing = await prisma.enrichment.findUnique({ where: { ideaId } })

        if (existing) {
            console.log(`[Worker] Enrichment already exists for ${ideaId}, skipping`)
            return { skipped: true }
        }

        // Call Python AI service
        const aiResponse = await fetch(
            `${process.env.AI_WORKER_URL ?? 'http://localhost:8000'}/enrich`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ideaId, title, rawDump, domain }),
                signal: AbortSignal.timeout(60000),
            }
        )

        if (!aiResponse.ok) {
            const error = aiResponse.text
            throw new Error(`AI service failed ${error}`)
        }

        const enrichment = await aiResponse.json() as Enrichment

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
                domainMeta: enrichment.domainMeta ?? {},
            },
            update: {
                category: enrichment.category,
                summary: enrichment.summary,
                viabilityNote: enrichment.viabilityNote,
                phases: enrichment.phases,
                estimatedHours: enrichment.estimatedHours,
                nextSteps: enrichment.nextSteps,
                domainMeta: enrichment.domainMeta ?? {},
            }
        })

        await prisma.idea.update({
            where: { id: ideaId },
            data: { status: 'ENRICHED' }
        })

        console.log(`[Worker] Enrichment complete for idea ${ideaId}`)
        return { success: true, ideaId }
    },
    {
        connection:redis,
        concurrency:3
    }
)

// Event Handlers

worker.on('completed', (job)=>{
    console.log(`[Worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err)=>{
    console.log(`[Worker] Job ${job?.id} failed:`,err.message)
    if(job && job.attemptsMade >= (job.opts.attempts?? 3)){
        console.log(`[Worker] Job ${job.id} exhausted all retries — moving to DLQ`)
    }
})

worker.on('error', (err)=>{
    console.log(`[Worker] Worker error:`,err)
})

console.log(`[Worker] Enrichment worker started, waiting for jobs...`)
