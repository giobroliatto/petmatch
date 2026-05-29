import { z } from 'zod'
import { ServiceType } from '@prisma/client'

export const SearchProvidersQuerySchema = z.object({
  city: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  homeVisit: z
    .string()
    .optional()
    .transform(v => v === 'true'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

export const MatchProvidersBodySchema = z.object({
  naturalLanguageQuery: z.string().min(10).max(500),
  petId: z.string().cuid(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  city: z.string().optional(),
  maxDistanceKm: z.coerce.number().positive().optional(),
})

export const UpdateProviderProfileBodySchema = z.object({
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(9).optional(),
  radiusKm: z.number().positive().max(100).optional(),
  serviceTypes: z.array(z.nativeEnum(ServiceType)).optional(),
})

export type SearchProvidersQuery = z.infer<typeof SearchProvidersQuerySchema>
export type MatchProvidersBody = z.infer<typeof MatchProvidersBodySchema>
export type UpdateProviderProfileBody = z.infer<typeof UpdateProviderProfileBodySchema>
