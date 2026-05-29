import Fastify from 'fastify'
import cors from '@fastify/cors'
import authPlugin from './plugins/auth.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { petsRoutes } from './modules/pets/pets.routes.js'
import { providersRoutes } from './modules/providers/providers.routes.js'
import { servicesRoutes } from './modules/services/services.routes.js'
import { availabilityRoutes } from './modules/availability/availability.routes.js'
import { bookingsRoutes } from './modules/bookings/bookings.routes.js'
import { messagesRoutes } from './modules/messages/messages.routes.js'
import { reviewsRoutes } from './modules/reviews/reviews.routes.js'
import { startWorkers } from './modules/ai/workers.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>
  }
}

const app = Fastify({ logger: true })

const start = async () => {
  try {
    await app.register(cors, {
      origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
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

    startWorkers()

    await app.listen({ port: 3001, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
