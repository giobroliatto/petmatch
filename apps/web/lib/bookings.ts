import { apiRequest, apiPost, apiPatch } from './api'

// ── Types ───────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'

export interface BookingListItem {
  id: string
  status: BookingStatus
  scheduledAt: string
  completedAt: string | null
  totalPrice: number
  notes: string | null
  briefing: string | null
  service: { id: string; name: string; type: string; price: number; durationMin: number }
  pet: { id: string; name: string; species: string }
  tutor: { id: string; user: { id: string; name: string; email: string } }
  provider: { id: string; city: string | null; user: { id: string; name: string; email: string } }
  review: { id: string; rating: number } | null
}

export interface BookingDetail {
  id: string
  status: BookingStatus
  scheduledAt: string
  completedAt: string | null
  totalPrice: number
  notes: string | null
  briefing: string | null
  service: {
    id: string
    name: string
    type: string
    price: number
    durationMin: number
    homeVisit: boolean
    description: string | null
  }
  pet: {
    id: string
    name: string
    species: string
    breed: string | null
    weightKg: number | null
    neutered: boolean
  }
  tutor: { id: string; user: { id: string; name: string; email: string; avatarUrl: string | null } }
  provider: {
    id: string
    city: string | null
    user: { id: string; name: string; email: string; avatarUrl: string | null }
  }
  review: {
    id: string
    rating: number
    comment: string | null
    providerReply: string | null
  } | null
}

export interface BookingMessage {
  id: string
  bookingId: string
  senderId: string
  content: string
  readAt: string | null
  createdAt: string
  sender: { id: string; name: string; avatarUrl: string | null }
}

export interface CreateBookingInput {
  providerId: string
  petId: string
  serviceId: string
  scheduledAt: string
  notes?: string
}

// ── Status metadata ─────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Aguardando confirmação',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  REJECTED: 'Recusado',
}

export const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

// ── API functions ───────────────────────────────────────────────────────────

export async function listMyBookings(
  token: string,
  status?: BookingStatus,
): Promise<BookingListItem[]> {
  const query = status ? `?status=${status}` : ''
  const result = await apiRequest<{ bookings: BookingListItem[] }>(`/bookings${query}`, { token })
  return result.bookings
}

export async function getBooking(token: string, id: string): Promise<BookingDetail> {
  const result = await apiRequest<{ booking: BookingDetail }>(`/bookings/${id}`, { token })
  return result.booking
}

export async function createBooking(
  token: string,
  data: CreateBookingInput,
): Promise<BookingDetail> {
  const result = await apiPost<{ booking: BookingDetail }>('/bookings', data, token)
  return result.booking
}

export async function confirmBooking(token: string, id: string): Promise<BookingDetail> {
  const result = await apiPatch<{ booking: BookingDetail }>(`/bookings/${id}/confirm`, {}, token)
  return result.booking
}

export async function rejectBooking(
  token: string,
  id: string,
  rejectionReason?: string,
): Promise<BookingDetail> {
  const result = await apiPatch<{ booking: BookingDetail }>(
    `/bookings/${id}/reject`,
    { rejectionReason },
    token,
  )
  return result.booking
}

export async function completeBooking(token: string, id: string): Promise<BookingDetail> {
  const result = await apiPatch<{ booking: BookingDetail }>(`/bookings/${id}/complete`, {}, token)
  return result.booking
}

export async function cancelBooking(token: string, id: string): Promise<BookingDetail> {
  const result = await apiPatch<{ booking: BookingDetail }>(`/bookings/${id}/cancel`, {}, token)
  return result.booking
}

// ── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(token: string, bookingId: string): Promise<BookingMessage[]> {
  const result = await apiRequest<{ messages: BookingMessage[] }>(
    `/bookings/${bookingId}/messages`,
    { token },
  )
  return result.messages
}

export async function sendMessage(
  token: string,
  bookingId: string,
  content: string,
): Promise<BookingMessage> {
  const result = await apiPost<{ message: BookingMessage }>(
    `/bookings/${bookingId}/messages`,
    { content },
    token,
  )
  return result.message
}

export async function getUnreadCount(token: string): Promise<number> {
  const result = await apiRequest<{ count: number }>('/messages/unread-count', { token })
  return result.count
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function createReview(
  token: string,
  data: { bookingId: string; rating: number; comment?: string },
): Promise<{ id: string; rating: number; comment: string | null }> {
  const result = await apiPost<{ review: { id: string; rating: number; comment: string | null } }>(
    '/reviews',
    data,
    token,
  )
  return result.review
}
