import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

// Voyage AI embeddings API (direct)
async function callEmbeddingAPI(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY
  if (!key) throw new Error('VOYAGE_API_KEY is not set')

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ model: 'voyage-3', input: [text] }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
  return data.data[0].embedding
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return callEmbeddingAPI(text)
}

function buildProviderText(provider: {
  bio?: string | null
  serviceTypes: string[]
  qualityTags: string[]
  city?: string | null
  state?: string | null
}): string {
  const parts: string[] = []
  if (provider.bio) parts.push(provider.bio)
  if (provider.serviceTypes.length > 0) parts.push(`Serviços: ${provider.serviceTypes.join(', ')}`)
  if (provider.qualityTags.length > 0) parts.push(`Qualidades: ${provider.qualityTags.join(', ')}`)
  if (provider.city) parts.push(`Cidade: ${provider.city}`)
  if (provider.state) parts.push(`Estado: ${provider.state}`)
  return parts.join('. ')
}

function buildPetText(pet: {
  name: string
  species: string
  breed?: string | null
  birthDate?: Date | null
  weightKg?: number | null
  neutered: boolean
  notes?: string | null
}): string {
  const parts: string[] = [`Pet: ${pet.name}`, `Espécie: ${pet.species}`]
  if (pet.breed) parts.push(`Raça: ${pet.breed}`)
  if (pet.birthDate) {
    const ageYears = Math.floor((Date.now() - pet.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
    parts.push(`Idade: ${ageYears} anos`)
  }
  if (pet.weightKg) parts.push(`Peso: ${pet.weightKg}kg`)
  parts.push(`Castrado: ${pet.neutered ? 'sim' : 'não'}`)
  if (pet.notes) parts.push(`Observações: ${pet.notes}`)
  return parts.join('. ')
}

function safeVectorLiteral(embedding: number[]): string {
  const safeNums = embedding.map(n => {
    const f = parseFloat(String(n))
    if (!Number.isFinite(f)) throw new Error('Invalid embedding value')
    return f.toFixed(8)
  })
  return `[${safeNums.join(',')}]`
}

export async function generateProviderEmbedding(providerId: string): Promise<void> {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId } })
  if (!provider) return

  const text = buildProviderText(provider)
  const embedding = await callEmbeddingAPI(text)
  const vectorLiteral = safeVectorLiteral(embedding)

  await prisma.$executeRaw(
    Prisma.sql`UPDATE "ProviderProfile" SET embedding = ${Prisma.raw(`'${vectorLiteral}'::vector`)} WHERE id = ${providerId}`,
  )
}

export async function generatePetEmbedding(petId: string): Promise<number[]> {
  const pet = await prisma.pet.findUnique({ where: { id: petId } })
  if (!pet) throw new Error('Pet não encontrado')

  const text = buildPetText(pet)
  const embedding = await callEmbeddingAPI(text)
  const vectorLiteral = safeVectorLiteral(embedding)

  await prisma.$executeRaw(
    Prisma.sql`UPDATE "Pet" SET embedding = ${Prisma.raw(`'${vectorLiteral}'::vector`)} WHERE id = ${petId}`,
  )

  return embedding
}

export type RawProviderCandidate = {
  id: string
  userId: string
  bio: string | null
  city: string | null
  state: string | null
  averageRating: number
  totalReviews: number
  serviceTypes: string[]
  qualityTags: string[]
  verified: boolean
  radiusKm: number
}

export async function findSimilarProviders(
  petEmbedding: number[],
  limit: number = 20,
): Promise<RawProviderCandidate[]> {
  const vectorLiteral = safeVectorLiteral(petEmbedding)

  return prisma.$queryRaw<RawProviderCandidate[]>(
    Prisma.sql`
      SELECT id, "userId", bio, city, state, "averageRating", "totalReviews",
             "serviceTypes", "qualityTags", verified, "radiusKm"
      FROM "ProviderProfile"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)}
      LIMIT ${limit}
    `,
  )
}

export async function getPetEmbeddingFromDB(petId: string): Promise<number[] | null> {
  const rows = await prisma.$queryRaw<Array<{ emb: string | null }>>(
    Prisma.sql`SELECT embedding::text AS emb FROM "Pet" WHERE id = ${petId}`,
  )
  const str = rows[0]?.emb
  if (!str) return null
  try {
    return JSON.parse(str) as number[]
  } catch {
    return null
  }
}
