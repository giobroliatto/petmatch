import type { FastifyInstance } from 'fastify'
import {
  CreateBookingBodySchema,
  UpdateBookingStatusBodySchema,
  ListBookingsQuerySchema,
} from './bookings.schema.js'
import {
  createBooking,
  listBookings,
  getBooking,
  confirmBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
} from './bookings.service.js'

export async function bookingsRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  // GET /bookings?status=
  fastify.get('/bookings', auth, async (req, reply) => {
    const parsed = ListBookingsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }
    try {
      const bookings = await listBookings(req.user.sub, parsed.data.status)
      return reply.send({ bookings })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao listar reservas'
      return reply.status(500).send({ error: message })
    }
  })

  // POST /bookings
  fastify.post('/bookings', auth, async (req, reply) => {
    const parsed = CreateBookingBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    try {
      const booking = await createBooking(req.user.sub, parsed.data)
      return reply.status(201).send({ booking })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar reserva'
      return reply.status(400).send({ error: message })
    }
  })

  // GET /bookings/:id
  fastify.get<{ Params: { id: string } }>('/bookings/:id', auth, async (req, reply) => {
    try {
      const booking = await getBooking(req.params.id, req.user.sub)
      return reply.send({ booking })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reserva não encontrada'
      return reply.status(404).send({ error: message })
    }
  })

  // PATCH /bookings/:id/confirm
  fastify.patch<{ Params: { id: string } }>('/bookings/:id/confirm', auth, async (req, reply) => {
    try {
      const booking = await confirmBooking(req.params.id, req.user.sub)
      return reply.send({ booking })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao confirmar reserva'
      return reply.status(400).send({ error: message })
    }
  })

  // PATCH /bookings/:id/reject
  fastify.patch<{ Params: { id: string } }>('/bookings/:id/reject', auth, async (req, reply) => {
    const parsed = UpdateBookingStatusBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    try {
      const booking = await rejectBooking(req.params.id, req.user.sub, parsed.data.rejectionReason)
      return reply.send({ booking })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao recusar reserva'
      return reply.status(400).send({ error: message })
    }
  })

  // PATCH /bookings/:id/complete
  fastify.patch<{ Params: { id: string } }>('/bookings/:id/complete', auth, async (req, reply) => {
    try {
      const booking = await completeBooking(req.params.id, req.user.sub)
      return reply.send({ booking })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao concluir reserva'
      return reply.status(400).send({ error: message })
    }
  })

  // PATCH /bookings/:id/cancel
  fastify.patch<{ Params: { id: string } }>('/bookings/:id/cancel', auth, async (req, reply) => {
    try {
      const booking = await cancelBooking(req.params.id, req.user.sub)
      return reply.send({ booking })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar reserva'
      return reply.status(400).send({ error: message })
    }
  })
}
