import type { FastifyInstance } from 'fastify'
import { SearchProvidersQuerySchema, MatchProvidersBodySchema, UpdateProviderProfileBodySchema } from './providers.schema.js'
import {
  searchProviders,
  getProviderProfile,
  listFeaturedProviders,
  getMyProviderProfile,
  updateMyProviderProfile,
} from './providers.service.js'
import { matchProviders } from '../ai/matching.service.js'
import { getEmbeddingQueue } from '../ai/workers.js'

export async function providersRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] }

  // GET /providers/search
  fastify.get('/providers/search', async (req, reply) => {
    const parsed = SearchProvidersQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }
    const result = await searchProviders(parsed.data)
    return reply.send(result)
  })

  // GET /providers/featured/:city
  fastify.get<{ Params: { city: string } }>('/providers/featured/:city', async (req, reply) => {
    const providers = await listFeaturedProviders(req.params.city)
    return reply.send({ providers })
  })

  // POST /providers/match (protected — tutor only)
  fastify.post('/providers/match', auth, async (req, reply) => {
    const parsed = MatchProvidersBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    try {
      const results = await matchProviders({ ...parsed.data, userId: req.user.sub })
      return reply.send({ results })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no matching'
      return reply.status(500).send({ error: message })
    }
  })

  // GET /providers/me (protected — provider only)
  fastify.get('/providers/me', auth, async (req, reply) => {
    const provider = await getMyProviderProfile(req.user.sub)
    if (!provider) return reply.status(404).send({ error: 'Perfil de prestador não encontrado' })
    return reply.send({ provider })
  })

  // PATCH /providers/me (protected — provider only)
  fastify.patch('/providers/me', auth, async (req, reply) => {
    const parsed = UpdateProviderProfileBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const updated = await updateMyProviderProfile(req.user.sub, parsed.data)
    // Regenerate embedding with updated profile data
    await getEmbeddingQueue().add('generate-provider-embedding', { providerId: updated.id })
    return reply.send({ provider: updated })
  })

  // GET /providers/:id
  fastify.get<{ Params: { id: string } }>('/providers/:id', async (req, reply) => {
    const provider = await getProviderProfile(req.params.id)
    if (!provider) return reply.status(404).send({ error: 'Prestador não encontrado' })
    return reply.send({ provider })
  })
}
