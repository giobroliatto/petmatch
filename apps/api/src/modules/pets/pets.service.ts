import { prisma } from '../../lib/prisma.js'
import { uploadFile, deleteFile } from '../../lib/r2.js'
import { BookingStatus } from '@prisma/client'
import type { CreatePetInput, UpdatePetInput, CreateHealthRecordInput } from './pets.schema.js'

const PET_SELECT = {
  id: true,
  name: true,
  species: true,
  breed: true,
  birthDate: true,
  weightKg: true,
  neutered: true,
  photoUrl: true,
  notes: true,
  tutorId: true,
  healthRecords: {
    orderBy: { date: 'desc' as const },
    take: 1,
  },
} as const

function keyFromUrl(url: string): string {
  return url.replace(/^https?:\/\/[^/]+\//, '')
}

async function resolveTutorProfileId(userId: string): Promise<string> {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error('Perfil de tutor não encontrado')
  return profile.id
}

export async function createPet(
  userId: string,
  input: CreatePetInput,
  photoFile?: { buffer: Buffer; contentType: string; filename: string },
) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  let photoUrl: string | undefined

  if (photoFile) {
    const key = `pets/${userId}/${Date.now()}-${photoFile.filename}`
    photoUrl = await uploadFile(key, photoFile.buffer, photoFile.contentType) ?? undefined
  }

  return prisma.pet.create({
    data: {
      ...input,
      photoUrl,
      tutor: { connect: { id: tutorProfileId } },
    },
    select: PET_SELECT,
  })
}

export async function updatePet(
  petId: string,
  userId: string,
  input: UpdatePetInput,
  photoFile?: { buffer: Buffer; contentType: string; filename: string },
) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  const pet = await prisma.pet.findUnique({ where: { id: petId } })
  if (!pet || pet.tutorId !== tutorProfileId) throw new Error('Pet não encontrado')

  let photoUrl = pet.photoUrl ?? undefined

  if (photoFile) {
    if (pet.photoUrl) {
      await deleteFile(keyFromUrl(pet.photoUrl)).catch(() => {})
    }
    const key = `pets/${userId}/${Date.now()}-${photoFile.filename}`
    photoUrl = await uploadFile(key, photoFile.buffer, photoFile.contentType) ?? undefined
  }

  return prisma.pet.update({
    where: { id: petId },
    data: { ...input, photoUrl },
    select: PET_SELECT,
  })
}

export async function deletePet(petId: string, userId: string) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  const pet = await prisma.pet.findUnique({ where: { id: petId } })
  if (!pet || pet.tutorId !== tutorProfileId) throw new Error('Pet não encontrado')

  const futureBooking = await prisma.booking.findFirst({
    where: {
      petId,
      scheduledAt: { gt: new Date() },
      status: { notIn: [BookingStatus.CANCELLED, BookingStatus.REJECTED] },
    },
  })
  if (futureBooking) {
    throw new Error('Não é possível excluir um pet com agendamentos futuros')
  }

  if (pet.photoUrl) {
    await deleteFile(keyFromUrl(pet.photoUrl)).catch(() => {})
  }

  await prisma.pet.delete({ where: { id: petId } })
}

export async function listPets(userId: string) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  return prisma.pet.findMany({
    where: { tutorId: tutorProfileId },
    select: PET_SELECT,
    orderBy: { name: 'asc' },
  })
}

export async function getPet(petId: string, userId: string) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    include: {
      healthRecords: { orderBy: { date: 'desc' } },
    },
  })
  if (!pet || pet.tutorId !== tutorProfileId) throw new Error('Pet não encontrado')
  return pet
}

export async function createHealthRecord(
  petId: string,
  userId: string,
  input: CreateHealthRecordInput,
) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  const pet = await prisma.pet.findUnique({ where: { id: petId } })
  if (!pet || pet.tutorId !== tutorProfileId) throw new Error('Pet não encontrado')

  return prisma.healthRecord.create({
    data: { ...input, pet: { connect: { id: petId } } },
  })
}

export async function deleteHealthRecord(recordId: string, userId: string) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  const record = await prisma.healthRecord.findUnique({
    where: { id: recordId },
    include: { pet: true },
  })
  if (!record || record.pet.tutorId !== tutorProfileId) throw new Error('Registro não encontrado')
  await prisma.healthRecord.delete({ where: { id: recordId } })
}

export async function getUpcomingHealthReminders(userId: string) {
  const tutorProfileId = await resolveTutorProfileId(userId)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  return prisma.healthRecord.findMany({
    where: {
      nextDueDate: { lte: sevenDaysFromNow, gte: new Date() },
      pet: { tutorId: tutorProfileId },
    },
    include: { pet: { select: { id: true, name: true, photoUrl: true } } },
    orderBy: { nextDueDate: 'asc' },
  })
}
