import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    tutorProfile: { findUnique: vi.fn() },
    pet: { findFirst: vi.fn() },
    providerProfile: { findMany: vi.fn() },
  },
}))
vi.mock('../src/lib/anthropic.js', () => ({ getAnthropic: vi.fn() }))
vi.mock('../src/modules/ai/embeddings.service.js', () => ({
  findSimilarProviders: vi.fn(),
  generatePetEmbedding: vi.fn(),
  getPetEmbeddingFromDB: vi.fn(),
}))

import { prisma } from '../src/lib/prisma.js'
import { getAnthropic } from '../src/lib/anthropic.js'
import {
  findSimilarProviders,
  generatePetEmbedding,
  getPetEmbeddingFromDB,
} from '../src/modules/ai/embeddings.service.js'
import { matchProviders } from '../src/modules/ai/matching.service.js'

// The service only reads a few fields from each model, so the fixtures stay small
// and are cast through `never` where Prisma's generated types would demand more.
type Candidate = {
  id: string
  verified: boolean
  city: string | null
  serviceTypes: string[]
  averageRating: number
}

const BC = 'Balneário Camboriú'

function candidate(id: string, overrides: Partial<Candidate> = {}): Candidate {
  return {
    id,
    verified: true,
    city: BC,
    serviceTypes: ['DOG_WALKING'],
    averageRating: 4.5,
    ...overrides,
  }
}

function details(c: Candidate, prices: number[] = [35]) {
  return {
    ...c,
    bio: `Bio de ${c.id}`,
    qualityTags: ['pontual'],
    totalReviews: 10,
    user: { name: `Prestador ${c.id}`, avatarUrl: null },
    services: prices.map(price => ({ name: 'Serviço', price })),
  }
}

const mocks = {
  findTutor: vi.mocked(prisma.tutorProfile.findUnique),
  findPet: vi.mocked(prisma.pet.findFirst),
  findProviders: vi.mocked(prisma.providerProfile.findMany),
  getAnthropic: vi.mocked(getAnthropic),
  storedEmbedding: vi.mocked(getPetEmbeddingFromDB),
  generateEmbedding: vi.mocked(generatePetEmbedding),
  vectorSearch: vi.mocked(findSimilarProviders),
}

const claudeCreate = vi.fn()

function claudeReplies(text: string) {
  claudeCreate.mockResolvedValue({ content: [{ type: 'text', text }] })
}

function ranking(...rows: Array<[providerId: string, matchScore: number]>) {
  return JSON.stringify(rows.map(([providerId, matchScore]) => ({
    providerId,
    matchScore,
    matchReason: `Motivo para ${providerId}`,
  })))
}

/**
 * providerProfile.findMany is called twice: once by the traditional search
 * (with `select`) and once to load full details for the candidates (with `include`).
 */
function providersInDb(candidates: Candidate[], prices: Record<string, number[]> = {}) {
  mocks.findProviders.mockImplementation(((args: { include?: unknown; where?: { id?: { in: string[] } } }) => {
    if (args.include) {
      const ids = args.where?.id?.in ?? []
      return Promise.resolve(
        candidates.filter(c => ids.includes(c.id)).map(c => details(c, prices[c.id])),
      )
    }
    return Promise.resolve(candidates)
  }) as never)
}

const input = {
  naturalLanguageQuery: 'alguém paciente para passear com meu cachorro idoso',
  petId: 'pet-1',
  userId: 'user-1',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})

  mocks.findTutor.mockResolvedValue({ id: 'tutor-1', city: BC } as never)
  mocks.findPet.mockResolvedValue({
    id: 'pet-1',
    name: 'Rex',
    species: 'DOG',
    breed: 'Labrador',
    birthDate: new Date('2015-01-01'),
    weightKg: 30,
    neutered: true,
    notes: 'Puxa a guia',
  } as never)
  mocks.getAnthropic.mockReturnValue({ messages: { create: claudeCreate } } as never)
  mocks.storedEmbedding.mockResolvedValue([0.1, 0.2, 0.3])
  mocks.vectorSearch.mockResolvedValue([])
  providersInDb([])
})

describe('matchProviders', () => {
  describe('ownership checks', () => {
    it('rejects users without a tutor profile', async () => {
      mocks.findTutor.mockResolvedValue(null)

      await expect(matchProviders(input)).rejects.toThrow('Perfil de tutor não encontrado')
    })

    it('rejects pets that do not belong to the tutor', async () => {
      mocks.findPet.mockResolvedValue(null)

      await expect(matchProviders(input)).rejects.toThrow('Pet não encontrado')
      expect(mocks.findPet).toHaveBeenCalledWith({ where: { id: 'pet-1', tutorId: 'tutor-1' } })
    })
  })

  describe('candidate search', () => {
    it('uses vector search with the stored pet embedding', async () => {
      const a = candidate('a')
      mocks.vectorSearch.mockResolvedValue([a] as never)
      providersInDb([a])
      claudeReplies(ranking(['a', 90]))

      const result = await matchProviders(input)

      expect(mocks.generateEmbedding).not.toHaveBeenCalled()
      expect(mocks.vectorSearch).toHaveBeenCalledWith([0.1, 0.2, 0.3], 20)
      expect(result.map(r => r.id)).toEqual(['a'])
    })

    it('generates the pet embedding when none is stored', async () => {
      mocks.storedEmbedding.mockResolvedValue(null)
      mocks.generateEmbedding.mockResolvedValue([0.9, 0.8])
      const a = candidate('a')
      mocks.vectorSearch.mockResolvedValue([a] as never)
      providersInDb([a])
      claudeReplies(ranking(['a', 90]))

      await matchProviders(input)

      expect(mocks.generateEmbedding).toHaveBeenCalledWith('pet-1')
      expect(mocks.vectorSearch).toHaveBeenCalledWith([0.9, 0.8], 20)
    })

    it('falls back to traditional search when the embedding cannot be generated', async () => {
      mocks.storedEmbedding.mockResolvedValue(null)
      mocks.generateEmbedding.mockRejectedValue(new Error('VOYAGE_API_KEY is not set'))
      providersInDb([candidate('a')])
      claudeReplies(ranking(['a', 90]))

      const result = await matchProviders(input)

      expect(mocks.vectorSearch).not.toHaveBeenCalled()
      expect(mocks.findProviders).toHaveBeenCalledWith(expect.objectContaining({
        where: { verified: true, city: { contains: BC.toLowerCase(), mode: 'insensitive' } },
      }))
      expect(result.map(r => r.id)).toEqual(['a'])
    })

    it('falls back to traditional search when vector search finds nothing', async () => {
      mocks.vectorSearch.mockResolvedValue([])
      providersInDb([candidate('a')])
      claudeReplies(ranking(['a', 90]))

      const result = await matchProviders(input)

      expect(mocks.vectorSearch).toHaveBeenCalled()
      expect(result.map(r => r.id)).toEqual(['a'])
    })

    it('passes the requested service type to the traditional search', async () => {
      mocks.storedEmbedding.mockResolvedValue(null)
      mocks.generateEmbedding.mockRejectedValue(new Error('offline'))
      claudeReplies('[]')

      await matchProviders({ ...input, serviceType: 'GROOMING' as never, city: 'Itajaí' })

      expect(mocks.findProviders).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          verified: true,
          city: { contains: 'itajaí', mode: 'insensitive' },
          serviceTypes: { has: 'GROOMING' },
        },
      }))
    })
  })

  describe('hard filters', () => {
    it('drops unverified providers, other cities and providers without the requested service', async () => {
      const candidates = [
        candidate('ok'),
        candidate('unverified', { verified: false }),
        candidate('other-city', { city: 'Itajaí' }),
        candidate('no-service', { serviceTypes: ['VETERINARY'] }),
      ]
      mocks.vectorSearch.mockResolvedValue(candidates as never)
      providersInDb(candidates)
      claudeReplies(ranking(['ok', 90]))

      const result = await matchProviders({ ...input, serviceType: 'DOG_WALKING' as never })

      const sentToClaude = JSON.parse(
        claudeCreate.mock.calls[0][0].messages[0].content.split('Available providers:\n')[1],
      ) as Array<{ providerId: string }>
      expect(sentToClaude.map(p => p.providerId)).toEqual(['ok'])
      expect(result.map(r => r.id)).toEqual(['ok'])
    })

    it('returns no results without calling Claude when every candidate is filtered out', async () => {
      const candidates = [candidate('unverified', { verified: false })]
      mocks.vectorSearch.mockResolvedValue(candidates as never)
      providersInDb(candidates)

      const result = await matchProviders(input)

      expect(result).toEqual([])
      expect(claudeCreate).not.toHaveBeenCalled()
    })
  })

  describe('reranking with Claude', () => {
    beforeEach(() => {
      const candidates = [candidate('a'), candidate('b'), candidate('c')]
      mocks.vectorSearch.mockResolvedValue(candidates as never)
      providersInDb(candidates)
    })

    it('orders results by score and keeps the reason from Claude', async () => {
      claudeReplies(ranking(['a', 40], ['b', 95], ['c', 70]))

      const result = await matchProviders(input)

      expect(result.map(r => [r.id, r.matchScore])).toEqual([['b', 95], ['c', 70], ['a', 40]])
      expect(result[0].matchReason).toBe('Motivo para b')
    })

    it('accepts a response wrapped in a markdown code fence', async () => {
      claudeReplies('```json\n' + ranking(['a', 80]) + '\n```')

      const result = await matchProviders(input)

      expect(result.map(r => r.id)).toEqual(['a'])
    })

    it('drops providers scored below 25 and IDs that were not candidates', async () => {
      claudeReplies(ranking(['a', 80], ['b', 24], ['c', 25], ['invented', 99]))

      const result = await matchProviders(input)

      expect(result.map(r => r.id)).toEqual(['a', 'c'])
    })

    it('ranks by position with a generic reason when the Claude call fails', async () => {
      claudeCreate.mockRejectedValue(new Error('overloaded'))

      const result = await matchProviders(input)

      expect(result.map(r => [r.id, r.matchScore])).toEqual([['a', 85], ['b', 80], ['c', 75]])
      expect(result.every(r => r.matchReason === 'Prestador disponível na sua região com boa avaliação.')).toBe(true)
    })

    it('uses the same fallback when Claude returns something that is not JSON', async () => {
      claudeReplies('Desculpe, não consegui avaliar os prestadores.')

      const result = await matchProviders(input)

      expect(result.map(r => r.matchScore)).toEqual([85, 80, 75])
    })

    it('uses the same fallback when the Anthropic API key is missing', async () => {
      mocks.getAnthropic.mockImplementation(() => {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set')
      })

      const result = await matchProviders(input)

      expect(result).toHaveLength(3)
    })
  })

  describe('result shape', () => {
    it('returns at most 10 providers', async () => {
      const candidates = Array.from({ length: 15 }, (_, i) => candidate(`p${i}`))
      mocks.vectorSearch.mockResolvedValue(candidates as never)
      providersInDb(candidates)
      claudeReplies(ranking(...candidates.map((c, i): [string, number] => [c.id, 90 - i])))

      const result = await matchProviders(input)

      expect(result).toHaveLength(10)
      expect(result[0].id).toBe('p0')
    })

    it('reports the cheapest active service as the starting price', async () => {
      const candidates = [candidate('a'), candidate('b')]
      mocks.vectorSearch.mockResolvedValue(candidates as never)
      providersInDb(candidates, { a: [120, 35, 80], b: [] })
      claudeReplies(ranking(['a', 90], ['b', 80]))

      const result = await matchProviders(input)

      expect(result.find(r => r.id === 'a')?.minPrice).toBe(35)
      expect(result.find(r => r.id === 'b')?.minPrice).toBeNull()
      expect(result[0]).toMatchObject({ name: 'Prestador a', verified: true, city: BC })
    })
  })
})
