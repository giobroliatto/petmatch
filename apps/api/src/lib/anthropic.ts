import Anthropic from '@anthropic-ai/sdk'

let instance: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }
  if (!instance) {
    instance = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return instance
}
