import type { FastifyInstance } from 'fastify'
import {
  getPlatformStats,
  listPendingVerifications,
  approveVerification,
  rejectVerification,
  listUsers,
  suspendUser,
  getDiagnostics,
} from './admin.service.js'

function requireAdmin(fastify: FastifyInstance) {
  return {
    onRequest: [
      fastify.authenticate,
      async (req: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
        if (!req.user.roles.includes('ADMIN')) {
          return reply.status(403).send({ error: 'Acesso negado' })
        }
      },
    ],
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // GET /admin/stats
  fastify.get('/admin/stats', requireAdmin(fastify), async (_req, reply) => {
    const stats = await getPlatformStats()
    return reply.send(stats)
  })

  // GET /admin/diagnostics
  fastify.get('/admin/diagnostics', requireAdmin(fastify), async (_req, reply) => {
    const diagnostics = await getDiagnostics()
    return reply.send(diagnostics)
  })

  // GET /admin/verifications
  fastify.get('/admin/verifications', requireAdmin(fastify), async (_req, reply) => {
    const verifications = await listPendingVerifications()
    return reply.send({ verifications })
  })

  // POST /admin/verifications/:providerId/approve
  fastify.post<{ Params: { providerId: string } }>(
    '/admin/verifications/:providerId/approve',
    requireAdmin(fastify),
    async (req, reply) => {
      try {
        await approveVerification(req.params.providerId)
        return reply.send({ ok: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao aprovar'
        return reply.status(400).send({ error: msg })
      }
    },
  )

  // POST /admin/verifications/:providerId/reject
  fastify.post<{ Params: { providerId: string }; Body: { reason: string } }>(
    '/admin/verifications/:providerId/reject',
    requireAdmin(fastify),
    async (req, reply) => {
      const { reason } = req.body ?? {}
      if (!reason) return reply.status(400).send({ error: 'reason é obrigatório' })
      try {
        await rejectVerification(req.params.providerId, reason)
        return reply.send({ ok: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao rejeitar'
        return reply.status(400).send({ error: msg })
      }
    },
  )

  // GET /admin/users
  fastify.get('/admin/users', requireAdmin(fastify), async (req, reply) => {
    const { page = '1', limit = '20', search } = req.query as Record<string, string | undefined>
    const result = await listUsers(Number(page), Number(limit), search)
    return reply.send(result)
  })

  // POST /admin/users/:userId/suspend
  fastify.post<{ Params: { userId: string }; Body: { reason: string } }>(
    '/admin/users/:userId/suspend',
    requireAdmin(fastify),
    async (req, reply) => {
      const { reason } = req.body ?? {}
      if (!reason) return reply.status(400).send({ error: 'reason é obrigatório' })
      try {
        await suspendUser(req.params.userId, reason)
        return reply.send({ ok: true })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao suspender usuário'
        return reply.status(400).send({ error: msg })
      }
    },
  )
}
