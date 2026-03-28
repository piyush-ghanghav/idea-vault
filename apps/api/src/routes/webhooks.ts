import { FastifyInstance, FastifyRequest } from 'fastify'
import { Webhook } from 'svix'
import { prisma } from '../lib/prisma'

export async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/webhooks/clerk', async (request: FastifyRequest, reply) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

    if (!WEBHOOK_SECRET) {
      return reply.status(500).send({ error: 'Webhook secret not configured' })
    }

    const svix_id = request.headers['svix-id'] as string
    const svix_timestamp = request.headers['svix-timestamp'] as string
    const svix_signature = request.headers['svix-signature'] as string

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return reply.status(400).send({ error: 'Missing svix headers' })
    }

    // rawBody is attached by our content type parser in index.ts
    const rawBody = (request as any).rawBody

    if (!rawBody) {
      return reply.status(400).send({ error: 'Missing raw body' })
    }

    const wh = new Webhook(WEBHOOK_SECRET)
    let evt: any

    try {
      evt = wh.verify(rawBody, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.log('Webhook verification failed:', err)
      return reply.status(400).send({ error: 'Invalid webhook signature' })
    }

    console.log('Webhook received:', evt.type)

    if (evt.type === 'user.created') {
      const { id, email_addresses } = evt.data
      const email = email_addresses[0]?.email_address

      try {
        await prisma.user.create({
          data: { clerkId: id, email: email ?? '' }
        })
        console.log('User created in DB:', id, email)
      } catch (err) {
        console.log('User creation failed (may already exist):', err)
      }
    }

    if (evt.type === 'user.deleted') {
      try {
        await prisma.user.deleteMany({ where: { clerkId: evt.data.id } })
        console.log('User deleted from DB:', evt.data.id)
      } catch (err) {
        console.log('User deletion failed:', err)
      }
    }

    return reply.send({ received: true })
  })
}
