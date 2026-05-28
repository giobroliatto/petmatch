import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'

export interface JwtPayload {
  sub: string
  roles: string[]
}

// Extend @fastify/jwt's UserType to include our payload fields
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const secret = process.env.API_SECRET
  if (!secret) throw new Error('API_SECRET environment variable is not set')

  await fastify.register(fastifyJwt, { secret })

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    await request.jwtVerify()
  })
}

export default fp(authPlugin, { name: 'auth' })
