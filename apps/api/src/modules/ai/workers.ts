import { Queue, Worker } from 'bullmq'
import { generatePetEmbedding, generateProviderEmbedding } from './embeddings.service.js'
import { analyzeProviderReviews } from './reviews.service.js'
import { prisma } from '../../lib/prisma.js'
import {
  sendNewBookingRequestEmail,
  sendBookingConfirmationEmail,
  sendBookingConfirmationProviderEmail,
  sendBookingRejectedEmail,
  sendReviewRequestEmail,
  sendMessageNotificationEmail,
  sendBookingReminderEmail,
} from '../../lib/email.js'

function getRedisConnectionOptions() {
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL is not set')
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  }
}

// Singleton queues (one connection each)
let _embeddingQueue: Queue | null = null
let _reviewsQueue: Queue | null = null
let _emailQueue: Queue | null = null

export function getEmbeddingQueue(): Queue {
  if (!_embeddingQueue) {
    _embeddingQueue = new Queue('embeddings', { connection: getRedisConnectionOptions() })
  }
  return _embeddingQueue
}

export function getReviewsQueue(): Queue {
  if (!_reviewsQueue) {
    _reviewsQueue = new Queue('reviews', { connection: getRedisConnectionOptions() })
  }
  return _reviewsQueue
}

export function getEmailQueue(): Queue {
  if (!_emailQueue) {
    _emailQueue = new Queue('emails', { connection: getRedisConnectionOptions() })
  }
  return _emailQueue
}

export function startWorkers(): void {
  new Worker(
    'embeddings',
    async job => {
      try {
        if (job.name === 'generate-pet-embedding') {
          await generatePetEmbedding(job.data.petId as string)
        } else if (job.name === 'generate-provider-embedding') {
          await generateProviderEmbedding(job.data.providerId as string)
        }
      } catch (err) {
        console.error(`[BullMQ] Embedding job "${job.name}" failed:`, err)
        throw err
      }
    },
    { connection: getRedisConnectionOptions() },
  )

  new Worker(
    'reviews',
    async job => {
      try {
        if (job.name === 'analyze-reviews') {
          await analyzeProviderReviews(job.data.providerId as string)
        }
      } catch (err) {
        console.error(`[BullMQ] Reviews job "${job.name}" failed:`, err)
        throw err
      }
    },
    { connection: getRedisConnectionOptions() },
  )

  new Worker(
    'emails',
    async job => {
      try {
        if (job.name === 'new-booking-request') {
          const booking = await prisma.booking.findUnique({
            where: { id: job.data.bookingId as string },
            include: {
              service: true,
              pet: true,
              tutor: { include: { user: true } },
              provider: { include: { user: true } },
            },
          })
          if (!booking) return
          await sendNewBookingRequestEmail(booking.provider.user.email, {
            bookingId: booking.id,
            serviceName: booking.service.name,
            providerName: booking.provider.user.name ?? '',
            tutorName: booking.tutor.user.name ?? '',
            petName: booking.pet.name,
            scheduledAt: booking.scheduledAt,
            totalPrice: booking.totalPrice,
            briefing: booking.briefing ?? undefined,
          })
        } else if (job.name === 'booking-confirmed') {
          const booking = await prisma.booking.findUnique({
            where: { id: job.data.bookingId as string },
            include: {
              service: true,
              pet: true,
              tutor: { include: { user: true } },
              provider: { include: { user: true } },
            },
          })
          if (!booking) return
          const details = {
            bookingId: booking.id,
            serviceName: booking.service.name,
            providerName: booking.provider.user.name ?? '',
            tutorName: booking.tutor.user.name ?? '',
            petName: booking.pet.name,
            scheduledAt: booking.scheduledAt,
            totalPrice: booking.totalPrice,
          }
          // Notify tutor (confirmation) AND provider (their own confirmation record)
          await Promise.all([
            sendBookingConfirmationEmail(booking.tutor.user.email, details),
            sendBookingConfirmationProviderEmail(booking.provider.user.email, details),
          ])
        } else if (job.name === 'booking-rejected') {
          const booking = await prisma.booking.findUnique({
            where: { id: job.data.bookingId as string },
            include: {
              service: true,
              pet: true,
              tutor: { include: { user: true } },
              provider: { include: { user: true } },
            },
          })
          if (!booking) return
          await sendBookingRejectedEmail(booking.tutor.user.email, {
            bookingId: booking.id,
            serviceName: booking.service.name,
            providerName: booking.provider.user.name ?? '',
            tutorName: booking.tutor.user.name ?? '',
            petName: booking.pet.name,
            scheduledAt: booking.scheduledAt,
            totalPrice: booking.totalPrice,
            rejectionReason: job.data.rejectionReason as string | undefined,
          })
        } else if (job.name === 'review-request') {
          const booking = await prisma.booking.findUnique({
            where: { id: job.data.bookingId as string },
            include: {
              service: true,
              pet: true,
              tutor: { include: { user: true } },
              provider: { include: { user: true } },
            },
          })
          if (!booking) return
          await sendReviewRequestEmail(booking.tutor.user.email, {
            bookingId: booking.id,
            serviceName: booking.service.name,
            providerName: booking.provider.user.name ?? '',
            tutorName: booking.tutor.user.name ?? '',
            petName: booking.pet.name,
            scheduledAt: booking.scheduledAt,
            totalPrice: booking.totalPrice,
          })
        } else if (job.name === 'reminder-24h' || job.name === 'reminder-2h') {
          const booking = await prisma.booking.findUnique({
            where: { id: job.data.bookingId as string },
            include: {
              service: true,
              pet: true,
              tutor: { include: { user: true } },
              provider: { include: { user: true } },
            },
          })
          if (!booking) return
          const hoursAhead = job.name === 'reminder-24h' ? 24 : 2
          await sendBookingReminderEmail(booking.tutor.user.email, {
            bookingId: booking.id,
            serviceName: booking.service.name,
            providerName: booking.provider.user.name ?? '',
            tutorName: booking.tutor.user.name ?? '',
            petName: booking.pet.name,
            scheduledAt: booking.scheduledAt,
            totalPrice: booking.totalPrice,
          }, hoursAhead)
        } else if (job.name === 'message-notification') {
          const recipient = await prisma.user.findUnique({
            where: { id: job.data.recipientId as string },
          })
          if (!recipient) return
          const booking = await prisma.booking.findUnique({
            where: { id: job.data.bookingId as string },
            include: {
              tutor: { include: { user: { select: { name: true } } } },
              provider: { include: { user: { select: { name: true } } } },
            },
          })
          if (!booking) return
          const isTutor = booking.tutor.userId === recipient.id
          const senderName = isTutor
            ? (booking.provider.user.name ?? 'Prestador')
            : (booking.tutor.user.name ?? 'Tutor')
          await sendMessageNotificationEmail(
            recipient.email,
            recipient.name ?? '',
            senderName,
            job.data.preview as string,
          )
        }
      } catch (err) {
        // Email failures are non-fatal — log but don't rethrow
        console.error(`[BullMQ] Email job "${job.name}" failed:`, err)
      }
    },
    { connection: getRedisConnectionOptions() },
  )

  console.log('[BullMQ] Workers started (embeddings, reviews, emails)')
}
