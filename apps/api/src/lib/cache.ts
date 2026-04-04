import { redis } from '../queue'

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
}