import { SERVICE_TYPE_LABELS } from './pets'

export { SERVICE_TYPE_LABELS }

export type ServiceType =
  | 'GROOMING'
  | 'DOG_WALKING'
  | 'VETERINARY'
  | 'TRAINING'
  | 'SITTING'
  | 'DAYCARE'
  | 'TRANSPORT'

export const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export interface ProviderService {
  id: string
  type: ServiceType
  name: string
  description?: string | null
  price: number
  durationMin: number
  homeVisit: boolean
  active: boolean
}

export interface ProviderAvailability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface ProviderReview {
  id: string
  rating: number
  comment?: string | null
  providerReply?: string | null
  createdAt: string
  booking: {
    tutor: {
      user: { name: string; avatarUrl?: string | null }
    }
  }
}

export interface ProviderCardData {
  id: string
  name: string
  avatarUrl?: string | null
  city?: string | null
  averageRating: number
  totalReviews: number
  serviceTypes: string[]
  qualityTags: string[]
  minPrice?: number | null
  verified: boolean
  matchScore?: number
  matchReason?: string
  services?: ProviderService[]
}

export interface ProviderFullProfile extends ProviderCardData {
  bio?: string | null
  state?: string | null
  phone?: string | null
  galleryUrls: string[]
  radiusKm: number
  services: ProviderService[]
  availability: ProviderAvailability[]
  reviews: ProviderReview[]
}

export interface MyProviderDashboard {
  id: string
  bio?: string | null
  city?: string | null
  state?: string | null
  verified: boolean
  verificationDocumentUrl?: string | null
  averageRating: number
  totalReviews: number
  qualityTags: string[]
  serviceTypes: string[]
  radiusKm: number
  galleryUrls: string[]
  user: {
    name: string
    avatarUrl?: string | null
    phone?: string | null
    email: string
  }
  services: ProviderService[]
  availability: ProviderAvailability[]
  reviews: ProviderReview[]
}

export interface SearchFilters {
  city?: string
  serviceType?: string
  minRating?: number
  maxPrice?: number
  homeVisit?: boolean
  page?: number
}

export interface SearchProvidersResponse {
  providers: ProviderCardData[]
  total: number
  page: number
}

export interface MatchProvidersResponse {
  results: ProviderCardData[]
}

export interface UpdateProviderProfileInput {
  bio?: string
  city?: string
  state?: string
  zipCode?: string
  radiusKm?: number
  serviceTypes?: ServiceType[]
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function uploadGalleryPhoto(token: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/providers/me/gallery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Erro ao fazer upload')
  }
  return ((await res.json()) as { url: string }).url
}

export async function deleteGalleryPhoto(token: string, photoUrl: string): Promise<void> {
  const res = await fetch(`${API_URL}/providers/me/gallery`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrl }),
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Erro ao deletar foto')
  }
}

export async function submitVerificationDoc(token: string, file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_URL}/providers/me/verification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? 'Erro ao enviar documento')
  }
}
