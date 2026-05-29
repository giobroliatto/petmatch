import { getAnthropic } from '../../lib/anthropic.js'

const TRIAGE_SYSTEM_PROMPT = `Você é um assistente especializado em serviços para pets.
Crie um briefing pré-serviço estruturado em português para o prestador de serviços.
O briefing deve incluir: informações essenciais do pet, cuidados especiais necessários e observações do tutor.
Use formatação clara com tópicos. Seja conciso e objetivo.`

export async function generateBookingBriefing(input: {
  serviceType: string
  petName: string
  petSpecies: string
  petBreed?: string | null
  petAgeYears?: number | null
  petWeightKg?: number | null
  petNeutered?: boolean
  petNotes?: string | null
  tutorNotes?: string | null
}): Promise<string> {
  const anthropic = getAnthropic()

  const petInfo = [
    `Nome: ${input.petName}`,
    `Espécie: ${input.petSpecies}`,
    input.petBreed ? `Raça: ${input.petBreed}` : null,
    input.petAgeYears != null ? `Idade: ${input.petAgeYears} anos` : null,
    input.petWeightKg != null ? `Peso: ${input.petWeightKg}kg` : null,
    input.petNeutered != null ? `Castrado: ${input.petNeutered ? 'sim' : 'não'}` : null,
    input.petNotes ? `Observações: ${input.petNotes}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: TRIAGE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Tipo de serviço: ${input.serviceType}\n\nPet:\n${petInfo}\n\nObservações do tutor: ${input.tutorNotes ?? 'Nenhuma'}`,
      },
    ],
  })

  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}
