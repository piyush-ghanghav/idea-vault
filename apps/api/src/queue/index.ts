// queue configuration

import { Queue } from "bullmq";
import IORedis from 'ioredis'

export const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null
})

export const enrichmentQueue = new Queue('idea-enrichment',{
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff:{
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    }
})
