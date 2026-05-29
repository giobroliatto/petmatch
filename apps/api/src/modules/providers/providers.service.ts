import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
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

  const [providers, total] = await prisma.$transaction([
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

  return { providers, total, page }
}

export async function getProviderProfile(providerId: string) {
  return prisma.providerProfile.findUnique({
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
