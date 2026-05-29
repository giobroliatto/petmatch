import { z } from 'zod'
import { ServiceType } from '@prisma/client'

export const CreateServiceBodySchema = z.object({
  type: z.nativeEnum(ServiceType),
  name: z.string().min(2).max(100),
  description: z.string().max(300).optional(),
  price: z.number().positive(),
  durationMin: z.number().int().positive(),
  homeVisit: z.boolean().default(false),
})

export const UpdateServiceBodySchema = z.object({
  type: z.nativeEnum(ServiceType).optional(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(300).optional(),
  price: z.number().positive().optional(),
  durationMin: z.number().int().positive().optional(),
  homeVisit: z.boolean().optional(),
  active: z.boolean().optional(),
})

export type CreateServiceBody = z.infer<typeof CreateServiceBodySchema>
export type UpdateServiceBody = z.infer<typeof UpdateServiceBodySchema>
