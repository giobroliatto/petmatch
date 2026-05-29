import { prisma } from '../../lib/prisma.js'
import { generateBookingBriefing } from '../ai/triage.service.js'
import { getEmailQueue } from '../ai/workers.js'
import type { BookingStatus } from '@prisma/client'
import type { CreateBookingBody } from './bookings.schema.js'

const BOOKING_LIST_INCLUDE = {
  service: { select: { id: true, name: true, type: true, price: true, durationMin: true } },
  pet: { select: { id: true, name: true, species: true } },
  tutor: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
  provider: {
    select: { id: true, city: true, user: { select: { id: true, name: true, email: true } } },
  },
  review: { select: { id: true, rating: true } },
} as const

const BOOKING_DETAIL_INCLUDE = {
  service: true,
  pet: true,
  tutor: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  },
  provider: {
    select: {
      id: true,
      city: true,
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  },
  review: true,
} as const

// ── Create ─────────────────────────────────────────────────────────────────

export async function createBooking(userId: string, data: CreateBookingBody) {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!tutor) throw new Error('Perfil de tutor não encontrado')

  const provider = await prisma.providerProfile.findUnique({
    where: { id: data.providerId },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!provider) throw new Error('Prestador não encontrado')

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, providerId: data.providerId, active: true },
  })
  if (!service) throw new Error('Serviço não encontrado ou inativo')

  const pet = await prisma.pet.findFirst({
    where: { id: data.petId, tutorId: tutor.id },
  })
  if (!pet) throw new Error('Pet não encontrado ou não pertence ao tutor')

  // AI briefing — non-blocking: fall back to null if it fails
  let briefing: string | undefined
  try {
    const petAgeYears = pet.birthDate
      ? Math.floor((Date.now() - pet.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null
    briefing = await generateBookingBriefing({
      serviceType: service.type,
      petName: pet.name,
      petSpecies: pet.species,
      petBreed: pet.breed ?? null,
      petAgeYears,
      petWeightKg: pet.weightKg ?? null,
      petNeutered: pet.neutered,
      petNotes: pet.notes ?? null,
      tutorNotes: data.notes ?? null,
    })
  } catch {
    console.warn('[Booking] Briefing generation failed, creating booking without it')
  }

  const booking = await prisma.booking.create({
    data: {
      tutorId: tutor.id,
      providerId: data.providerId,
      petId: data.petId,
      serviceId: data.serviceId,
      scheduledAt: new Date(data.scheduledAt),
      notes: data.notes,
      briefing,
      totalPrice: service.price,
      status: 'PENDING',
    },
    include: BOOKING_DETAIL_INCLUDE,
  })

  // Queue email notification for provider
  getEmailQueue()
    .add('new-booking-request', { bookingId: booking.id })
    .catch(() => {})

  return booking
}

// ── List ───────────────────────────────────────────────────────────────────

export async function listBookings(userId: string, status?: BookingStatus) {
  const tutor = await prisma.tutorProfile.findUnique({ where: { userId } })
  if (tutor) {
    return prisma.booking.findMany({
      where: { tutorId: tutor.id, ...(status ? { status } : {}) },
      include: BOOKING_LIST_INCLUDE,
      orderBy: { scheduledAt: 'desc' },
    })
  }

  const provider = await prisma.providerProfile.findUnique({ where: { userId } })
  if (provider) {
    return prisma.booking.findMany({
      where: { providerId: provider.id, ...(status ? { status } : {}) },
      include: BOOKING_LIST_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    })
  }

  return []
}

// ── Get single ─────────────────────────────────────────────────────────────

export async function getBooking(id: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      OR: [{ tutor: { userId } }, { provider: { userId } }],
    },
    include: BOOKING_DETAIL_INCLUDE,
  })
  if (!booking) throw new Error('Reserva não encontrada')
  return booking
}

// ── Status transitions ─────────────────────────────────────────────────────

export async function confirmBooking(id: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, provider: { userId }, status: 'PENDING' },
  })
  if (!booking) throw new Error('Reserva não encontrada ou não pode ser confirmada')

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'CONFIRMED' },
    include: BOOKING_DETAIL_INCLUDE,
  })

  getEmailQueue()
    .add('booking-confirmed', { bookingId: id })
    .catch(() => {})

  return updated
}

export async function rejectBooking(id: string, userId: string, reason?: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, provider: { userId }, status: 'PENDING' },
  })
  if (!booking) throw new Error('Reserva não encontrada ou não pode ser recusada')

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'REJECTED', notes: reason ? `[Motivo da recusa] ${reason}` : undefined },
    include: BOOKING_DETAIL_INCLUDE,
  })

  getEmailQueue()
    .add('booking-rejected', { bookingId: id, rejectionReason: reason })
    .catch(() => {})

  return updated
}

export async function completeBooking(id: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, provider: { userId }, status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
  })
  if (!booking) throw new Error('Reserva não encontrada ou não pode ser concluída')

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: BOOKING_DETAIL_INCLUDE,
  })

  // Queue review request email (delayed 1h)
  getEmailQueue()
    .add('review-request', { bookingId: id }, { delay: 60 * 60 * 1000 })
    .catch(() => {})

  return updated
}

export async function cancelBooking(id: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      OR: [{ tutor: { userId } }, { provider: { userId } }],
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
  })
  if (!booking) throw new Error('Reserva não encontrada ou não pode ser cancelada')

  return prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: BOOKING_DETAIL_INCLUDE,
  })
}
