import './lib/env'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { ideasRoutes } from './routes/ideas'
import { webhookRoutes } from './routes/webhooks'
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

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
