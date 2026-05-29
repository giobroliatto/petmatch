import { prisma } from '../../lib/prisma.js'
import { redis } from '../../lib/redis.js'
import { getEmailQueue } from '../ai/workers.js'

// ── Send message ───────────────────────────────────────────────────────────

export async function sendMessage(bookingId: string, userId: string, content: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ tutor: { userId } }, { provider: { userId } }],
    },
    include: {
      tutor: { select: { userId: true } },
      provider: { select: { userId: true } },
    },
  })
  if (!booking) throw new Error('Reserva não encontrada ou acesso negado')
  if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status)) {
    throw new Error('Não é possível enviar mensagens para esta reserva')
  }

  const message = await prisma.message.create({
    data: { bookingId, senderId: userId, content },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  })

  // Throttled email notification (max once per 30 min per recipient per booking)
  const recipientId =
    booking.tutor.userId === userId ? booking.provider.userId : booking.tutor.userId

  const throttleKey = `msg_notif:${recipientId}:${bookingId}`
  const alreadyNotified = await redis.get(throttleKey)
  if (!alreadyNotified) {
    getEmailQueue()
      .add('message-notification', { bookingId, recipientId, preview: content })
      .catch(() => {})
    await redis.set(throttleKey, '1', 'EX', 1800)
  }

  return message
}

// ── Get messages ────────────────────────────────────────────────────────────

export async function getMessages(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ tutor: { userId } }, { provider: { userId } }],
    },
  })
  if (!booking) throw new Error('Reserva não encontrada ou acesso negado')

  const messages = await prisma.message.findMany({
    where: { bookingId },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  })

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: { bookingId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  })

  return messages
}

// ── Unread count ────────────────────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      booking: {
        OR: [{ tutor: { userId } }, { provider: { userId } }],
      },
    },
  })
}
