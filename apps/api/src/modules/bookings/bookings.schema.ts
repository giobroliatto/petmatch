import { z } from 'zod'

export const CreateBookingBodySchema = z.object({
  providerId: z.string().min(1),
  petId: z.string().min(1),
  serviceId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(1000).optional(),
})

export const UpdateBookingStatusBodySchema = z.object({
  rejectionReason: z.string().max(500).optional(),
})

export const ListBookingsQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'])
    .optional(),
})

export type CreateBookingBody = z.infer<typeof CreateBookingBodySchema>
export type UpdateBookingStatusBody = z.infer<typeof UpdateBookingStatusBodySchema>
export type ListBookingsQuery = z.infer<typeof ListBookingsQuerySchema>
