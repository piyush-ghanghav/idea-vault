import '../lib/env'
import { Worker, Queue, Job } from 'bullmq'
import { redis } from './index'
import { prisma } from '../lib/prisma'
import { cache } from '../lib/cache'

// Queue for the repeatable cron job
export const reviewQueue = new Queue('goal-review', {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 10,
        removeOnFail: 50,
    }
})

// Schedule the daily check — runs at 9am every day
// Called once at startup, BullMQ deduplicates via jobId
export async function scheduleDailyReviewCheck() {
    await reviewQueue.add(
        'daily-review-check',
        {},
        {
            repeat: { pattern: '0 9 * * *' },
            jobId: 'daily-review-check', // prevents duplicate schedules on restart
        }
    )
    console.log('[ReviewWorker] Daily review check scheduled at 9am')
}

const reviewWorker = new Worker(
    'goal-review',
    async (job: Job) => {
        console.log(`[ReviewWorker] Running daily review check`)

        const users = await prisma.user.findMany({
            select: { id: true, clerkId: true }
        })

        for (const user of users) {

            const recentIdeaCount = await prisma.idea.count({
                where: {
                    userId: user.id,
                    createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                }
            })

            // Only surface goals if user has low cognitive load
            const lowCognitiveLoad = recentIdeaCount < 5

            if (!lowCognitiveLoad) {
                console.log(`[ReviewWorker] User ${user.id} has high load (${recentIdeaCount} ideas), skipping`)
                continue
            }

            // Find goals due for review
            const dueGoals = await prisma.learningGoal.findMany({
                where: {
                    userId: user.id,
                    status: 'ACTIVE',
                    nextReviewAt: { lte: new Date() }
                },
                take: 3, // surface max 3 at a time, not overwhelming
            })

            if (dueGoals.length === 0) continue

            console.log(`[ReviewWorker] User ${user.id} has ${dueGoals.length} goals due for review`)

            // Publish to Redis → Socket.io notifies user if online
            await cache.publishGoalsDue(user.clerkId, dueGoals)
        }

        return { success: true }
    },
    {
        connection: redis,
        concurrency: 1,
    }
)

reviewWorker.on('completed', (job) => {
    console.log(`[ReviewWorker] Job ${job.id} completed`)
})

reviewWorker.on('failed', (job, err) => {
    console.log(`[ReviewWorker] Job ${job?.id} failed:`, err.message)
})

console.log('[ReviewWorker] Goal review worker started')