import { getAnthropic } from '../../lib/anthropic.js'
import { prisma } from '../../lib/prisma.js'

const REVIEWS_SYSTEM_PROMPT = `Você é um assistente que analisa avaliações de prestadores de serviços para pets.
Extraia até 6 tags de qualidade em português com base nas avaliações.
Exemplos de tags: "pontual", "ótimo com pets ansiosos", "muito carinhoso", "comunicativo", "espaço limpo", "seguro", "atencioso".
Retorne APENAS um array JSON de strings. Nenhum outro texto.`

export async function analyzeProviderReviews(providerId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: { providerId },
    select: { comment: true, rating: true },
  })

  const reviewsWithText = reviews.filter(r => r.comment && r.comment.trim().length > 0)
  if (reviewsWithText.length === 0) return

  const reviewsText = reviewsWithText
    .map(r => `Rating: ${r.rating}/5 — "${r.comment}"`)
    .join('\n')

  const anthropic = getAnthropic()

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    system: REVIEWS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Avaliações do prestador:\n${reviewsText}`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') return

  let tags: string[] = []
  try {
    const parsed = JSON.parse(block.text.trim()) as unknown
    if (Array.isArray(parsed)) {
      tags = parsed.filter((t): t is string => typeof t === 'string').slice(0, 6)
    }
  } catch {
    return
  }

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: { qualityTags: tags },
  })
}
