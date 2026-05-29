import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../lib/prisma.js'
import { getReviewsQueue } from '../ai/workers.js'

const CreateReviewBodySchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export async function reviewsRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  // POST /reviews
  fastify.post('/reviews', auth, async (req, reply) => {
    const parsed = CreateReviewBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { bookingId, rating, comment } = parsed.data
    const userId = req.user.sub

    // Find completed booking owned by this tutor
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tutor: { userId },
        status: 'COMPLETED',
      },
      include: {
        review: { select: { id: true } },
        provider: { select: { id: true } },
      },
    })

    if (!booking) {
      return reply.status(404).send({ error: 'Reserva não encontrada ou não concluída' })
    }
    if (booking.review) {
      return reply.status(409).send({ error: 'Avaliação já existe para esta reserva' })
    }

    // Create review
    const review = await prisma.review.create({
      data: { bookingId, providerId: booking.provider.id, rating, comment },
    })

    // Update provider aggregate rating
    const { _avg, _count } = await prisma.review.aggregate({
      where: { providerId: booking.provider.id },
      _avg: { rating: true },
      _count: { id: true },
    })

    await prisma.providerProfile.update({
      where: { id: booking.provider.id },
      data: {
        averageRating: _avg.rating ?? 0,
        totalReviews: _count.id,
      },
    })

    // Queue AI review analysis
    getReviewsQueue()
      .add('analyze-reviews', { providerId: booking.provider.id })
      .catch(() => {})

    return reply.status(201).send({ review })
  })
}
