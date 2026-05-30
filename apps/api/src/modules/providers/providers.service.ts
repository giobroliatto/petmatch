import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { uploadFile, deleteFile } from '../../lib/r2.js'
import type { SearchProvidersQuery, UpdateProviderProfileBody } from './providers.schema.js'

export async function searchProviders(filters: SearchProvidersQuery) {
  const { city, serviceType, minRating, maxPrice, homeVisit, page, limit } = filters

  const where: Prisma.ProviderProfileWhereInput = {}

  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (serviceType) where.serviceTypes = { has: serviceType }
  if (minRating !== undefined) where.averageRating = { gte: minRating }

  if (maxPrice !== undefined || homeVisit) {
    const serviceFilter: Prisma.ServiceWhereInput = { active: true }
    if (maxPrice !== undefined) serviceFilter.price = { lte: maxPrice }
    if (homeVisit) serviceFilter.homeVisit = true
    where.services = { some: serviceFilter }
  }

  const [rows, total] = await prisma.$transaction([
    prisma.providerProfile.findMany({
      where,
      include: {
        user: { select: { name: true, avatarUrl: true } },
        services: { where: { active: true }, orderBy: { price: 'asc' } },
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { averageRating: 'desc' },
    }),
    prisma.providerProfile.count({ where }),
  ])

  const providers = rows.map(p => ({ ...p, name: p.user.name, avatarUrl: p.user.avatarUrl ?? null }))
  return { providers, total, page }
}

export async function getProviderProfile(providerId: string) {
  const data = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: {
      user: { select: { name: true, avatarUrl: true, phone: true } },
      services: { where: { active: true }, orderBy: { price: 'asc' } },
      availability: { orderBy: { dayOfWeek: 'asc' } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          booking: {
            include: {
              tutor: {
                include: { user: { select: { name: true, avatarUrl: true } } },
              },
            },
          },
        },
      },
    },
  })
  if (!data) return null
  return { ...data, name: data.user.name, avatarUrl: data.user.avatarUrl ?? null, phone: data.user.phone ?? null }
}

export async function getMyProviderProfile(userId: string) {
  return prisma.providerProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { name: true, avatarUrl: true, phone: true, email: true } },
      services: { orderBy: [{ active: 'desc' }, { price: 'asc' }] },
      availability: { orderBy: { dayOfWeek: 'asc' } },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          booking: {
            include: {
              tutor: {
                include: { user: { select: { name: true, avatarUrl: true } } },
              },
            },
          },
        },
      },
    },
  })
}

export async function updateMyProviderProfile(userId: string, data: UpdateProviderProfileBody) {
  return prisma.providerProfile.update({
    where: { userId },
    data: {
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
      ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
      ...(data.radiusKm !== undefined && { radiusKm: data.radiusKm }),
      ...(data.serviceTypes !== undefined && { serviceTypes: data.serviceTypes }),
    },
  })
}

export async function listFeaturedProviders(city: string) {
  return prisma.providerProfile.findMany({
    where: {
      city: { contains: city, mode: 'insensitive' },
      averageRating: { gte: 4.5 },
      totalReviews: { gte: 5 },
      verified: true,
    },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      services: { where: { active: true }, orderBy: { price: 'asc' }, take: 3 },
    },
    orderBy: { averageRating: 'desc' },
    take: 10,
  })
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function uploadGalleryPhoto(userId: string, buffer: Buffer, mimeType: string): Promise<string> {
  const provider = await prisma.providerProfile.findUnique({ where: { userId }, select: { id: true, galleryUrls: true } })
  if (!provider) throw new Error('Perfil de prestador não encontrado')
  if (provider.galleryUrls.length >= 10) throw new Error('Limite de 10 fotos atingido')

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  const key = `gallery/${provider.id}/${Date.now()}.${ext}`
  const url = await uploadFile(key, buffer, mimeType)

  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: { galleryUrls: { push: url } },
  })
  return url
}

export async function deleteGalleryPhoto(userId: string, photoUrl: string): Promise<void> {
  const provider = await prisma.providerProfile.findUnique({ where: { userId }, select: { id: true, galleryUrls: true } })
  if (!provider) throw new Error('Perfil de prestador não encontrado')
  if (!provider.galleryUrls.includes(photoUrl)) throw new Error('Foto não encontrada')

  // Extract R2 key from URL
  const publicUrl = process.env.R2_PUBLIC_URL ?? ''
  const key = photoUrl.replace(`${publicUrl}/`, '')
  await deleteFile(key)

  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: { galleryUrls: provider.galleryUrls.filter(u => u !== photoUrl) },
  })
}

// ─── Verification ─────────────────────────────────────────────────────────────

export async function submitVerification(userId: string, buffer: Buffer, mimeType: string): Promise<void> {
  const provider = await prisma.providerProfile.findUnique({ where: { userId }, select: { id: true } })
  if (!provider) throw new Error('Perfil de prestador não encontrado')

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'application/pdf' ? 'pdf' : 'jpg'
  const key = `verifications/${provider.id}/${Date.now()}.${ext}`
  const url = await uploadFile(key, buffer, mimeType)

  await prisma.providerProfile.update({
    where: { id: provider.id },
    data: { verificationDocumentUrl: url, verificationSubmittedAt: new Date() },
  })
}
