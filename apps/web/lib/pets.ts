export type PetSpecies = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'OTHER'

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  DOG: 'Cachorro',
  CAT: 'Gato',
  BIRD: 'Pássaro',
  RABBIT: 'Coelho',
  OTHER: 'Outro',
}

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  GROOMING: 'Banho e Tosa',
  DOG_WALKING: 'Passeio',
  VETERINARY: 'Veterinário',
  TRAINING: 'Adestramento',
  SITTING: 'Hospedagem',
  DAYCARE: 'Creche',
  TRANSPORT: 'Transporte',
}

export interface HealthRecord {
  id: string
  petId: string
  title: string
  description?: string | null
  date: string
  nextDueDate?: string | null
}

export interface Pet {
  id: string
  name: string
  species: PetSpecies
  breed?: string | null
  birthDate?: string | null
  weightKg?: number | null
  neutered: boolean
  photoUrl?: string | null
  notes?: string | null
  tutorId: string
  healthRecords: HealthRecord[]
}

export interface PetWithFullHistory extends Omit<Pet, 'healthRecords'> {
  healthRecords: HealthRecord[]
}

export function calcAge(birthDate: string | null | undefined): string {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(months / 12)
  return `${years} ${years === 1 ? 'ano' : 'anos'}`
}

export function healthRecordStatus(nextDueDate: string | null | undefined): 'ok' | 'soon' | 'urgent' {
  if (!nextDueDate) return 'ok'
  const due = new Date(nextDueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 7) return 'urgent'
  if (diffDays <= 30) return 'soon'
  return 'ok'
}
