import { z } from 'zod'

export const PetSpeciesEnum = z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER'])

export const CreatePetInputSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  species: PetSpeciesEnum,
  breed: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  weightKg: z.coerce.number().positive().optional(),
  neutered: z.coerce.boolean().default(false),
  notes: z.string().optional(),
})

export const UpdatePetInputSchema = CreatePetInputSchema.partial()

export const CreateHealthRecordInputSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.coerce.date(),
  nextDueDate: z.coerce.date().optional(),
})

export type CreatePetInput = z.infer<typeof CreatePetInputSchema>
export type UpdatePetInput = z.infer<typeof UpdatePetInputSchema>
export type CreateHealthRecordInput = z.infer<typeof CreateHealthRecordInputSchema>
