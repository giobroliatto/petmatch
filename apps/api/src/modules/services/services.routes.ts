import type { FastifyInstance } from 'fastify'
import { CreateServiceBodySchema, UpdateServiceBodySchema } from './services.schema.js'
import { createService, updateService, deleteService } from './services.service.js'

export async function servicesRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  fastify.post('/services', auth, async (req, reply) => {
    const parsed = CreateServiceBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    try {
      const service = await createService(req.user.sub, parsed.data)
      return reply.status(201).send({ service })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar serviço'
      return reply.status(400).send({ error: message })
    }
  })

  fastify.patch<{ Params: { id: string } }>('/services/:id', auth, async (req, reply) => {
    const parsed = UpdateServiceBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    try {
      const service = await updateService(req.params.id, req.user.sub, parsed.data)
      return reply.send({ service })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar serviço'
      return reply.status(400).send({ error: message })
    }
  })

  fastify.delete<{ Params: { id: string } }>('/services/:id', auth, async (req, reply) => {
    try {
      await deleteService(req.params.id, req.user.sub)
      return reply.status(204).send()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir serviço'
      return reply.status(400).send({ error: message })
    }
  })
}
