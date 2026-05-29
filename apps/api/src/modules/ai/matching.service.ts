import { prisma } from '../../lib/prisma.js'
import { getAnthropic } from '../../lib/anthropic.js'
import {
  findSimilarProviders,
  generatePetEmbedding,
  getPetEmbeddingFromDB,
} from './embeddings.service.js'
import type { ServiceType } from '@prisma/client'

export interface MatchResult {
  id: string
  name: string
  avatarUrl: string | null
  city: string | null
  averageRating: number
  totalReviews: number
  serviceTypes: string[]
  qualityTags: string[]
  minPrice: number | null
  verified: boolean
  matchScore: number
  matchReason: string
}

const SYSTEM_PROMPT = `You are a pet service matching assistant. Given a tutor's request and a list of available providers, rank the providers from most to least suitable and explain briefly why each one matches.

Return a JSON array with this structure:
[{ "providerId": "...", "matchScore": 0-100, "matchReason": "brief explanation in Portuguese" }]

Return ONLY the JSON array, no other text.`

async function rerankWithClaude(
  query: string,
  petText: string,
  providers: Array<{
    providerId: string
    name: string
    bio: string
    serviceTypes: string[]
    qualityTags: string[]
    city: string | null
    averageRating: number
  }>,
): Promise<Array<{ providerId: string; matchScore: number; matchReason: string }>> {
  const anthropic = getAnthropic()

  const userMessage = `Tutor request: ${query}
Pet profile: ${petText}

Available providers:
${JSON.stringify(providers, null, 2)}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')

  return JSON.parse(block.text.trim()) as Array<{
    providerId: string
    matchScore: number
    matchReason: string
  }>
}

export async function matchProviders(input: {
  naturalLanguageQuery: string
  petId: string
  serviceType?: ServiceType
  city?: string
  maxDistanceKm?: number
  userId: string
}): Promise<MatchResult[]> {
  // Resolve tutor profile
  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: input.userId } })
  if (!tutorProfile) throw new Error('Perfil de tutor não encontrado')

  // Verify pet ownership
  const pet = await prisma.pet.findFirst({
    where: { id: input.petId, tutorId: tutorProfile.id },
  })
  if (!pet) throw new Error('Pet não encontrado')

  // Get or generate pet embedding
  let petEmbedding = await getPetEmbeddingFromDB(input.petId)
  if (!petEmbedding) {
    petEmbedding = await generatePetEmbedding(input.petId)
  }

  // Find similar providers via pgvector (top 20)
  const candidates = await findSimilarProviders(petEmbedding, 20)

  // Hard filters: verified, city, serviceType
  const city = (input.city ?? tutorProfile.city ?? '').toLowerCase()
  const filtered = candidates.filter(p => {
    if (!p.verified) return false
    if (city && !p.city?.toLowerCase().includes(city)) return false
    if (input.serviceType && !p.serviceTypes.includes(input.serviceType)) return false
    return true
  })

  if (filtered.length === 0) return []

  // Fetch full provider data for filtered candidates
  const providerDetails = await prisma.providerProfile.findMany({
    where: { id: { in: filtered.map(p => p.id) } },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      services: { where: { active: true }, orderBy: { price: 'asc' } },
    },
  })

  // Build pet profile text for Claude
  const petAge = pet.birthDate
    ? `${Math.floor((Date.now() - pet.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365))} anos`
    : null
  const petText = [pet.name, pet.species, pet.breed, petAge, pet.notes]
    .filter(Boolean)
    .join(', ')

  // Build provider list for Claude
  const providerList = providerDetails.map(p => ({
    providerId: p.id,
    name: p.user.name,
    bio: p.bio ?? '',
    serviceTypes: p.serviceTypes,
    qualityTags: p.qualityTags,
    city: p.city,
    averageRating: p.averageRating,
  }))

  // AI re-ranking with fallback
  let rankings: Array<{ providerId: string; matchScore: number; matchReason: string }>
  try {
    rankings = await rerankWithClaude(input.naturalLanguageQuery, petText, providerList)
  } catch {
    rankings = providerList.map((p, i) => ({
      providerId: p.providerId,
      matchScore: Math.max(50, 85 - i * 5),
      matchReason: 'Prestador disponível na sua região com boa avaliação.',
    }))
  }

  // Merge rankings with full provider data
  const detailsMap = new Map(providerDetails.map(p => [p.id, p]))

  return rankings
    .slice(0, 10)
    .map(r => {
      const p = detailsMap.get(r.providerId)
      if (!p) return null
      const minPrice = p.services.length > 0 ? Math.min(...p.services.map(s => s.price)) : null
      return {
        id: p.id,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl ?? null,
        city: p.city ?? null,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        serviceTypes: p.serviceTypes as string[],
        qualityTags: p.qualityTags,
        minPrice,
        verified: p.verified,
        matchScore: r.matchScore,
        matchReason: r.matchReason,
      }
    })
    .filter((r): r is MatchResult => r !== null)
}
