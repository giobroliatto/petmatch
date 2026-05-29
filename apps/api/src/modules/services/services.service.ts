import { prisma } from '../../lib/prisma.js'
import type { CreateServiceBody, UpdateServiceBody } from './services.schema.js'

async function getProviderOrThrow(userId: string) {
  const provider = await prisma.providerProfile.findUnique({ where: { userId } })
  if (!provider) throw new Error('Perfil de prestador não encontrado')
  return provider
}

export async function createService(userId: string, data: CreateServiceBody) {
  const provider = await getProviderOrThrow(userId)
  return prisma.service.create({ data: { providerId: provider.id, ...data } })
}

export async function updateService(serviceId: string, userId: string, data: UpdateServiceBody) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { provider: { select: { userId: true } } },
  })
  if (!service) throw new Error('Serviço não encontrado')
  if (service.provider.userId !== userId) throw new Error('Não autorizado')
  return prisma.service.update({ where: { id: serviceId }, data })
}

export async function deleteService(serviceId: string, userId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { provider: { select: { userId: true } } },
  })
  if (!service) throw new Error('Serviço não encontrado')
  if (service.provider.userId !== userId) throw new Error('Não autorizado')
  return prisma.service.delete({ where: { id: serviceId } })
}
