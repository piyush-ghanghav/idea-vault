import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '@clerk/backend'
import { prisma } from '../lib/prisma'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing authorization header' })
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })
    const clerkId = payload.sub

    const user = await prisma.user.findUnique({ where: { clerkId } })

    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }

    request.userId = user.id
  } catch (err) {
    console.log('AUTH FAILED:', err)
    return reply.status(401).send({ error: 'Invalid token' })
  }
}
