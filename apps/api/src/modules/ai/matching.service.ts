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

const SYSTEM_PROMPT = `Você é um assistente de matching de serviços para pets. Dado o pedido de um tutor e o perfil do pet, ordene os prestadores do mais ao menos adequado.

Retorne um array JSON com esta estrutura — APENAS o array, sem texto extra:
[{ "providerId": "...", "matchScore": 0-100, "matchReason": "explicação breve em português" }]

Critérios de pontuação (aplique todos):
1. SERVIÇOS (peso DECISIVO): o prestador oferece o tipo de serviço que o tutor pediu?
   - SIM → score começa em 60+
   - NÃO → score máximo é 15. NÃO mostre prestadores sem o serviço solicitado, dê score 0-10.
2. TAGS DE QUALIDADE: as qualityTags batem com as necessidades do pet? Cada tag relevante +10 pts.
3. AVALIAÇÃO: averageRating >= 4.5 → +10 pts; >= 4.0 → +5 pts.
4. BIO: menciona características relevantes? → +5 a +10 pts.

REGRA IMPORTANTE: Se o tutor pede "passeio" e o prestador só tem "veterinário", o score deve ser 0 ou 5. Não inclua prestadores irrelevantes.

Na matchReason, mencione especificamente qual serviço e/ou tag bateu com o pedido. Se não bater, diga "Não oferece o serviço solicitado."
`

async function rerankWithClaude(
  query: string,
  petText: string,
  providers: Array<{
    providerId: string
    name: string
    bio: string
    services: string
    serviceTypes: string[]
    qualityTags: string[]
    city: string | null
    averageRating: number
    totalReviews: number
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

  // Strip markdown code fences if present (e.g. ```json ... ```)
  const raw = block.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

  return JSON.parse(raw) as Array<{
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
  const tutorCity = tutorProfile.city

  // Verify pet ownership
  const pet = await prisma.pet.findFirst({
    where: { id: input.petId, tutorId: tutorProfile.id },
  })
  if (!pet) throw new Error('Pet não encontrado')

  // Get or generate pet embedding — fall back to traditional search if Voyage AI is unavailable
  let petEmbedding: number[] | null = await getPetEmbeddingFromDB(input.petId)
  if (!petEmbedding) {
    try {
      petEmbedding = await generatePetEmbedding(input.petId)
    } catch {
      console.warn('[Matching] Could not generate pet embedding — falling back to traditional search')
    }
  }

  // Build traditional search helper (used as fallback)
  async function traditionalSearch() {
    const city = (input.city ?? tutorCity ?? '').toLowerCase()
    return prisma.providerProfile.findMany({
      where: {
        verified: true,
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(input.serviceType ? { serviceTypes: { has: input.serviceType } } : {}),
      },
      select: {
        id: true, userId: true, bio: true, city: true, state: true,
        averageRating: true, totalReviews: true, serviceTypes: true,
        qualityTags: true, verified: true, radiusKm: true,
      },
      orderBy: { averageRating: 'desc' },
      take: 20,
    })
  }

  // Vector search (when embedding available) — fall back to traditional if no embeddings in DB
  let candidates: Awaited<ReturnType<typeof findSimilarProviders>>
  if (petEmbedding) {
    candidates = await findSimilarProviders(petEmbedding, 20)
    if (candidates.length === 0) {
      console.log('[Matching] Vector search returned 0 — providers may lack embeddings, falling back to traditional search')
      candidates = await traditionalSearch()
    }
  } else {
    candidates = await traditionalSearch()
  }

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
  const petText = [
    `Nome: ${pet.name}`,
    `Espécie: ${pet.species}`,
    pet.breed ? `Raça: ${pet.breed}` : null,
    petAge ? `Idade: ${petAge}` : null,
    pet.weightKg ? `Peso: ${pet.weightKg}kg` : null,
    pet.neutered ? 'Castrado: sim' : 'Castrado: não',
    pet.notes ? `Observações do tutor: ${pet.notes}` : null,
  ].filter(Boolean).join('. ')

  // Build provider list for Claude — include service names for better matching
  const providerList = providerDetails.map(p => ({
    providerId: p.id,
    name: p.user.name,
    bio: p.bio ?? '',
    services: p.services.map(s => `${s.name} (R$${s.price})`).join(', '),
    serviceTypes: p.serviceTypes,
    qualityTags: p.qualityTags,
    city: p.city,
    averageRating: p.averageRating,
    totalReviews: p.totalReviews,
  }))

  // AI re-ranking with fallback
  let rankings: Array<{ providerId: string; matchScore: number; matchReason: string }>
  try {
    rankings = await rerankWithClaude(input.naturalLanguageQuery, petText, providerList)
  } catch (err) {
    console.error('[Matching] Claude reranking failed:', err instanceof Error ? err.message : err)
    rankings = providerList.map((p, i) => ({
      providerId: p.providerId,
      matchScore: Math.max(50, 85 - i * 5),
      matchReason: 'Prestador disponível na sua região com boa avaliação.',
    }))
  }

  // Filter out providers with very low score (irrelevant to the query)
  const SCORE_THRESHOLD = 25
  rankings = rankings.filter(r => r.matchScore >= SCORE_THRESHOLD)

  // Merge rankings with full provider data
  const detailsMap = new Map(providerDetails.map(p => [p.id, p]))

  return rankings
    .sort((a, b) => b.matchScore - a.matchScore)
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
