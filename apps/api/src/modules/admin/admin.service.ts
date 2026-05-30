import { prisma } from '../../lib/prisma.js'
import { sendProviderVerifiedEmail, sendProviderRejectedEmail, sendUserSuspendedEmail } from '../../lib/email.js'

export async function getPlatformStats() {
  const [
    totalUsers,
    totalProviders,
    totalBookings,
    bookingsByStatus,
    bookingsThisMonth,
    pendingVerifications,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.providerProfile.count(),
    prisma.booking.count(),
    prisma.booking.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.providerProfile.count({
      where: { verified: false, verificationDocumentUrl: { not: null } },
    }),
  ])

  const byStatus: Record<string, number> = {}
  for (const row of bookingsByStatus) {
    byStatus[row.status] = row._count.id
  }

  return { totalUsers, totalProviders, totalBookings, bookingsByStatus: byStatus, bookingsThisMonth, pendingVerifications }
}

export async function listPendingVerifications() {
  return prisma.providerProfile.findMany({
    where: { verified: false, verificationDocumentUrl: { not: null } },
    select: {
      id: true,
      verificationDocumentUrl: true,
      verificationSubmittedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { verificationSubmittedAt: 'asc' },
  })
}

export async function approveVerification(providerId: string) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!provider) throw new Error('Prestador não encontrado')

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: { verified: true, verifiedAt: new Date() },
  })

  await sendProviderVerifiedEmail(provider.user.email, provider.user.name)
}

export async function rejectVerification(providerId: string, reason: string) {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: { user: { select: { email: true, name: true } } },
  })
  if (!provider) throw new Error('Prestador não encontrado')

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: { verificationDocumentUrl: null, verificationSubmittedAt: null },
  })

  await sendProviderRejectedEmail(provider.user.email, provider.user.name, reason)
}

export async function listUsers(page: number, limit: number, search?: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        suspended: true,
        createdAt: true,
        avatarUrl: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.user.count({ where }),
  ])

  return { users, total, page }
}

export async function suspendUser(userId: string, reason: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, suspended: true } })
  if (!user) throw new Error('Usuário não encontrado')
  if (user.suspended) throw new Error('Usuário já está suspenso')

  await prisma.user.update({ where: { id: userId }, data: { suspended: true } })
  await sendUserSuspendedEmail(user.email, user.name, reason)
}
