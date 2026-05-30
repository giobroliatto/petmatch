/**
 * Seed script — dados de teste para desenvolvimento
 * Execute: pnpm --filter api prisma db seed
 *
 * Cria:
 *   admin@petmatch.dev   senha: Admin123!   role: ADMIN
 *   provider@petmatch.dev senha: Prov123!    role: PROVIDER  (com perfil, serviços, disponibilidade)
 *   tutor@petmatch.dev   senha: Tutor123!   role: TUTOR     (com perfil, pet, reserva)
 */

import { PrismaClient, BookingStatus, ServiceType, PetSpecies } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const ROUNDS = 10

  // ─── Admin ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123!', ROUNDS)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@petmatch.dev' },
    update: {},
    create: {
      email: 'admin@petmatch.dev',
      name: 'Admin PetMatch',
      passwordHash: adminHash,
      roles: ['ADMIN'],
    },
  })
  console.log('✓ admin:', admin.email)

  // ─── Provider ─────────────────────────────────────────────────────────────
  const providerHash = await bcrypt.hash('Prov123!', ROUNDS)
  const provider = await prisma.user.upsert({
    where: { email: 'provider@petmatch.dev' },
    update: {},
    create: {
      email: 'provider@petmatch.dev',
      name: 'Maria Cuidados Pet',
      passwordHash: providerHash,
      roles: ['PROVIDER'],
      providerProfile: {
        create: {
          bio: 'Especialista em cuidados de cães e gatos há 5 anos. Atendo em Balneário Camboriú e região.',
          city: 'Balneário Camboriú',
          state: 'SC',
          zipCode: '88330-000',
          latitude: -26.9914,
          longitude: -48.6353,
          radiusKm: 15,
          serviceTypes: [ServiceType.GROOMING, ServiceType.DOG_WALKING, ServiceType.SITTING],
          averageRating: 4.8,
          totalReviews: 23,
          qualityTags: ['pontual', 'carinhosa', 'comunicativa'],
          // Simula documento de verificação enviado (sem R2 real)
          verificationDocumentUrl: 'https://example.com/doc-placeholder.pdf',
          verificationSubmittedAt: new Date(),
          verified: true,
          verifiedAt: new Date(),
          services: {
            create: [
              {
                type: ServiceType.GROOMING,
                name: 'Banho e Tosa',
                description: 'Banho completo com tosa higiênica ou na tesoura.',
                price: 80,
                durationMin: 90,
                homeVisit: false,
                active: true,
              },
              {
                type: ServiceType.DOG_WALKING,
                name: 'Passeio Diário',
                description: 'Passeio de 40 min nas orlas de BC.',
                price: 35,
                durationMin: 40,
                homeVisit: true,
                active: true,
              },
              {
                type: ServiceType.SITTING,
                name: 'Hospedagem',
                description: 'Seu pet fica em casa comigo, com atenção 24h.',
                price: 120,
                durationMin: 1440,
                homeVisit: false,
                active: true,
              },
            ],
          },
          availability: {
            create: [
              // Seg–Sex 08:00–18:00
              ...([1, 2, 3, 4, 5] as const).map((dayOfWeek) => ({
                dayOfWeek,
                startTime: '08:00',
                endTime: '18:00',
              })),
              // Sáb 09:00–14:00
              { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
            ],
          },
        },
      },
    },
    include: { providerProfile: true },
  })
  console.log('✓ provider:', provider.email, '| perfil id:', provider.providerProfile?.id)

  // ─── Tutor ────────────────────────────────────────────────────────────────
  const tutorHash = await bcrypt.hash('Tutor123!', ROUNDS)
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@petmatch.dev' },
    update: {},
    create: {
      email: 'tutor@petmatch.dev',
      name: 'João Tutor',
      passwordHash: tutorHash,
      roles: ['TUTOR'],
      tutorProfile: {
        create: {
          city: 'Balneário Camboriú',
          state: 'SC',
          zipCode: '88330-000',
          latitude: -26.9914,
          longitude: -48.6353,
          pets: {
            create: [
              {
                name: 'Rex',
                species: PetSpecies.DOG,
                breed: 'Labrador',
                birthDate: new Date('2021-03-15'),
                weightKg: 28,
              },
              {
                name: 'Mimi',
                species: PetSpecies.CAT,
                breed: 'Siamês',
                birthDate: new Date('2022-07-01'),
                weightKg: 4.2,
              },
            ],
          },
        },
      },
    },
    include: { tutorProfile: { include: { pets: true } } },
  })
  console.log('✓ tutor:', tutor.email, '| pets:', tutor.tutorProfile?.pets.map((p) => p.name).join(', '))

  // ─── Booking de exemplo ───────────────────────────────────────────────────
  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: provider.id },
    include: { services: true },
  })
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutor.id },
    include: { pets: true },
  })
  const groomingService = providerProfile?.services.find((s) => s.type === ServiceType.GROOMING)
  const rex = tutorProfile?.pets.find((p) => p.name === 'Rex')

  if (providerProfile && tutorProfile && groomingService && rex) {
    const existing = await prisma.booking.findFirst({
      where: { tutorId: tutorProfile.id, providerId: providerProfile.id },
    })
    if (!existing) {
      const booking = await prisma.booking.create({
        data: {
          tutorId: tutorProfile.id,
          providerId: providerProfile.id,
          serviceId: groomingService.id,
          petId: rex.id,
          status: BookingStatus.CONFIRMED,
          scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // daqui 3 dias
          totalPrice: groomingService.price,
          notes: 'Rex é muito dócil, mas não gosta de secador alto.',
        },
      })
      console.log('✓ booking CONFIRMED criado:', booking.id)
    } else {
      console.log('✓ booking já existia, pulado')
    }
  }

  // ─── Segunda reserva — PENDING (para testar filtros de status) ────────────
  if (providerProfile && tutorProfile && groomingService && rex) {
    const walkService = providerProfile.services.find((s) => s.type === ServiceType.DOG_WALKING)
    if (walkService) {
      const existingPending = await prisma.booking.findFirst({
        where: {
          tutorId: tutorProfile.id,
          providerId: providerProfile.id,
          serviceId: walkService.id,
          status: BookingStatus.PENDING,
        },
      })
      if (!existingPending) {
        await prisma.booking.create({
          data: {
            tutorId: tutorProfile.id,
            providerId: providerProfile.id,
            serviceId: walkService.id,
            petId: rex.id,
            status: BookingStatus.PENDING,
            scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            totalPrice: walkService.price,
          },
        })
        console.log('✓ booking PENDING criado')
      }
    }
  }

  console.log('\nSeed concluído! Credenciais:')
  console.log('  Admin:    admin@petmatch.dev    / Admin123!')
  console.log('  Provider: provider@petmatch.dev / Prov123!')
  console.log('  Tutor:    tutor@petmatch.dev    / Tutor123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
