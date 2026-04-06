import { redis } from '../queue'
import IORedis from 'ioredis'

//separate connection for pub/sub
export const subscriber = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null
}
)

const TTL = {
    IDEAS_LIST: 60 * 5
}

export const cache = {
    // Get ideas list for a user
    async getIdeas(userId: string) {
        const key = `ideas:${userId}`
        const cached = await redis.get(key)

        if (cached) {
            console.log(`[Cache] HIT — ${key}`)
            return JSON.parse(cached)
        }
        console.log(`[Cache] MISS — ${key}`)
        return null
    },

    // Set as list for a user
    async setIdeas(userId: string, data: any) {
        const key = `ideas:${userId}`
        await redis.setex(key, TTL.IDEAS_LIST, JSON.stringify(data))
    },

    // Invalidate ideas list for a user
    async invalidateIdeas(userId: string) {
        const key = `ideas:${userId}`
        await redis.del(key)
        console.log(`[Cache] INVALIDATED — ${key}`)
    },

    // Publish enrichment complete event
    async publishEnrichmentComplete(clerkId: string, ideaId: string, enrichment: any) {
        const payload = JSON.stringify({ clerkId, ideaId, enrichment })
        await redis.publish('enrichment:complete', payload)
        console.log(`[PubSub] Published enrichment:complete for idea ${ideaId}`)
    }
}