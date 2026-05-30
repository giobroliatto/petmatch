import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import authPlugin from './plugins/auth.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { petsRoutes } from './modules/pets/pets.routes.js'
import { providersRoutes } from './modules/providers/providers.routes.js'
import { servicesRoutes } from './modules/services/services.routes.js'
import { availabilityRoutes } from './modules/availability/availability.routes.js'
import { bookingsRoutes } from './modules/bookings/bookings.routes.js'
import { messagesRoutes } from './modules/messages/messages.routes.js'
import { reviewsRoutes } from './modules/reviews/reviews.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'
import { startWorkers } from './modules/ai/workers.js'

import { redis } from './lib/redis.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  }
}

const IS_DEV = process.env.NODE_ENV !== 'production'
const app = Fastify({
  logger: true,
  bodyLimit: 5 * 1024 * 1024, // 5MB max for JSON bodies
})

// ── Security: HTTP headers ────────────────────────────────────────────────────
app.addHook('onSend', (_req, reply, _payload, done) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  done()
})

const start = async () => {
  try {
    await app.register(cors, {
      origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })

    // ── Rate limiting (Redis store) ─────────────────────────────────────────
    await app.register(rateLimit, {
      redis,
      // In dev, use very high limits so tests aren't blocked
      global: false, // per-route config only
    })

    await app.register(authPlugin)
    await app.register(authRoutes)
    await app.register(petsRoutes)
    await app.register(providersRoutes)
    await app.register(servicesRoutes)
    await app.register(availabilityRoutes)
    await app.register(bookingsRoutes)
    await app.register(messagesRoutes)
    await app.register(reviewsRoutes)
    await app.register(adminRoutes)

    startWorkers()

    await app.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
