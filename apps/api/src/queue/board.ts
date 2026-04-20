import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { FastifyAdapter } from '@bull-board/fastify'
import { enrichmentQueue } from './index'
import { reviewQueue } from './review.worker'

export function setupBullBoard() {
  const serverAdapter = new FastifyAdapter()
  serverAdapter.setBasePath('/admin/queues')

  createBullBoard({
    queues: [
      new BullMQAdapter(enrichmentQueue),
      new BullMQAdapter(reviewQueue)
    ],
    serverAdapter,
  })

  return serverAdapter
}
