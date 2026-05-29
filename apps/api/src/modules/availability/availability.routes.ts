import type { FastifyInstance } from 'fastify'
import { SetAvailabilityBodySchema } from './availability.schema.js'
import { setAvailability } from './availability.service.js'

export async function availabilityRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.put('/availability', auth, async (req, reply) => {
    const parsed = SetAvailabilityBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    try {
      const availability = await setAvailability(req.user.sub, parsed.data)
      return reply.send({ availability })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar disponibilidade'
      return reply.status(400).send({ error: message })
    }
  })
}
