import './lib/env'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { ideasRoutes } from './routes/ideas'
import { webhookRoutes } from './routes/webhooks'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { subscriber } from './lib/cache'
import { focusRoutes } from './routes/focus'
import { goalsRoutes } from './routes/goals'
import { setupBullBoard } from './queue/board'
import { graphRoutes } from './routes/graph'
import { scheduleDailyReviewCheck } from './queue/review.worker'

const isDev = process.env.NODE_ENV !== 'production'

const server = Fastify({
  logger: isDev
    ? {
      transport: {
        target: 'pino-pretty'
      }
    }
    : true
})

const httpServer = createServer(server.server)
export const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
})

server.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
  try {
    const json = JSON.parse(body as string)
      ; (req as any).rawBody = body
    done(null, json)
  } catch (err: any) {
    done(err, undefined)
  }
})

server.decorateRequest('userId', '')

server.register(cors, {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

server.register(helmet)
server.register(webhookRoutes, { prefix: '/api' })
server.register(ideasRoutes, { prefix: '/api' })
server.register(focusRoutes, { prefix: '/api' })
server.register(goalsRoutes, { prefix: '/api' })
const bullBoardAdapter = setupBullBoard()
server.register(bullBoardAdapter.registerPlugin(), { prefix: '/admin/queues' })
server.register(graphRoutes, { prefix: '/api' })

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`)

  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`)
    console.log(`[Socket.IO] User ${userId} joined their room`)
  })

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
  })

})

subscriber.subscribe('enrichment:complete', (err) => {
  if (err)
    console.error('[PubSub] Subscribe error: ', err)
  else
    console.log(`[PubSub] Subscribed to enrichment:complete`)
})

subscriber.subscribe('goals:due', (err) => {
  if (err) console.error('[PubSub] Subscribe error:', err)
  else console.log('[PubSub] Subscribed to goals:due')
})

subscriber.on('message', (channel, message) => {
  if (channel === 'enrichment:complete') {
    const { clerkId, ideaId, enrichment } = JSON.parse(message)
    console.log(`[PubSub] Received enrichment:complete for idea ${ideaId}`)

    io.to(`user:${clerkId}`).emit('enrichment:complete', {
      ideaId,
      enrichment
    })
    console.log(`[PubSub] Emitted enrichment:complete to user ${clerkId} for idea ${ideaId}`)
  }

  if (channel === 'goals:due') {
    const { clerkId, goals } = JSON.parse(message)
    console.log(`[PubSub] Received goals:due for user ${clerkId}`)
    io.to(`user:${clerkId}`).emit('goals:due', { goals })
  }
})


server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' })

    httpServer.listen(3002, () => {
      console.log('[Socket] Socket.io server listening on port 3002')
    })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

scheduleDailyReviewCheck().catch(console.error)
start()
