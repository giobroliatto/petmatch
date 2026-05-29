import { prisma } from '../../lib/prisma.js'
import type { SetAvailabilityBody } from './availability.schema.js'

export async function setAvailability(userId: string, data: SetAvailabilityBody) {
  const provider = await prisma.providerProfile.findUnique({ where: { userId } })
  if (!provider) throw new Error('Perfil de prestador não encontrado')

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { providerId: provider.id } }),
    prisma.availability.createMany({
      data: data.slots.map(slot => ({ providerId: provider.id, ...slot })),
    }),
  ])

  return prisma.availability.findMany({
    where: { providerId: provider.id },
    orderBy: { dayOfWeek: 'asc' },
  })
}
