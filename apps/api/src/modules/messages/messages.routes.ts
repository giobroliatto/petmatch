import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { sendMessage, getMessages, getUnreadCount } from './messages.service.js'

const SendMessageBodySchema = z.object({
  content: z.string().min(1).max(2000),
})

export async function messagesRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  // GET /bookings/:id/messages
  fastify.get<{ Params: { id: string } }>(
    '/bookings/:id/messages',
    auth,
    async (req, reply) => {
      try {
        const messages = await getMessages(req.params.id, req.user.sub)
        return reply.send({ messages })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao buscar mensagens'
        return reply.status(404).send({ error: message })
      }
    },
  )

  // POST /bookings/:id/messages
  fastify.post<{ Params: { id: string } }>(
    '/bookings/:id/messages',
    auth,
    async (req, reply) => {
      const parsed = SendMessageBodySchema.safeParse(req.body)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
      }
      try {
        const msg = await sendMessage(req.params.id, req.user.sub, parsed.data.content)
        return reply.status(201).send({ message: msg })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar mensagem'
        return reply.status(400).send({ error: message })
      }
    },
  )

  // GET /messages/unread-count
  fastify.get('/messages/unread-count', auth, async (req, reply) => {
    try {
      const count = await getUnreadCount(req.user.sub)
      return reply.send({ count })
    } catch {
      return reply.send({ count: 0 })
    }
  })
}
