import type { FastifyInstance } from 'fastify'
import {
  RegisterInputSchema,
  LoginInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
} from './auth.schema.js'
import { register, login, forgotPassword, resetPassword } from './auth.service.js'
import { prisma } from '../../lib/prisma.js'

export async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const parsed = RegisterInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors })
    }
    const user = await register(parsed.data)
    return reply.status(201).send({ user })
  })

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const parsed = LoginInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors })
    }
    const result = await login(parsed.data, (payload) =>
      fastify.jwt.sign(payload, { expiresIn: '24h' }),
    )
    return reply.send(result)
  })

  // POST /auth/forgot-password
  fastify.post('/auth/forgot-password', async (request, reply) => {
    const parsed = ForgotPasswordInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors })
    }
    await forgotPassword(parsed.data.email)
    // Always return 200 to prevent user enumeration
    return reply.send({ message: 'Se o e-mail existir, você receberá as instruções em breve.' })
  })

  // POST /auth/reset-password
  fastify.post('/auth/reset-password', async (request, reply) => {
    const parsed = ResetPasswordInputSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors })
    }
    await resetPassword(parsed.data.token, parsed.data.newPassword)
    return reply.send({ message: 'Senha redefinida com sucesso.' })
  })

  // GET /auth/me — protected
  fastify.get(
    '/auth/me',
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string; roles: string[] }
      const user = await prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, name: true, email: true, roles: true, avatarUrl: true },
      })
      if (!user) return reply.status(404).send({ message: 'Usuário não encontrado' })
      return reply.send({ user })
    },
  )
}
