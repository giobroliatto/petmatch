import { z } from 'zod'

export const AvailabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido, use HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido, use HH:MM'),
})

export const SetAvailabilityBodySchema = z.object({
  slots: z.array(AvailabilitySlotSchema),
})

export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>
export type SetAvailabilityBody = z.infer<typeof SetAvailabilityBodySchema>
