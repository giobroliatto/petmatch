import { Queue, Worker } from 'bullmq'
import { generatePetEmbedding, generateProviderEmbedding } from './embeddings.service.js'
import { analyzeProviderReviews } from './reviews.service.js'

function getRedisConnectionOptions() {
  const url = process.env.REDIS_URL
  if (!url) throw new Error('REDIS_URL is not set')
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  }
}

// Singleton queues (one connection each)
let _embeddingQueue: Queue | null = null
let _reviewsQueue: Queue | null = null

export function getEmbeddingQueue(): Queue {
  if (!_embeddingQueue) {
    _embeddingQueue = new Queue('embeddings', { connection: getRedisConnectionOptions() })
  }
  return _embeddingQueue
}

export function getReviewsQueue(): Queue {
  if (!_reviewsQueue) {
    _reviewsQueue = new Queue('reviews', { connection: getRedisConnectionOptions() })
  }
  return _reviewsQueue
}

export function startWorkers(): void {
  new Worker(
    'embeddings',
    async job => {
      try {
        if (job.name === 'generate-pet-embedding') {
          await generatePetEmbedding(job.data.petId as string)
        } else if (job.name === 'generate-provider-embedding') {
          await generateProviderEmbedding(job.data.providerId as string)
        }
      } catch (err) {
        console.error(`[BullMQ] Embedding job "${job.name}" failed:`, err)
        throw err
      }
    },
    { connection: getRedisConnectionOptions() },
  )

  new Worker(
    'reviews',
    async job => {
      try {
        if (job.name === 'analyze-reviews') {
          await analyzeProviderReviews(job.data.providerId as string)
        }
      } catch (err) {
        console.error(`[BullMQ] Reviews job "${job.name}" failed:`, err)
        throw err
      }
    },
    { connection: getRedisConnectionOptions() },
  )

  console.log('[BullMQ] Workers started (embeddings, reviews)')
}
