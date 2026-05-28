import type { FastifyInstance, FastifyRequest } from 'fastify'
import multipart from '@fastify/multipart'
import {
  CreatePetInputSchema,
  UpdatePetInputSchema,
  CreateHealthRecordInputSchema,
} from './pets.schema.js'
import {
  createPet,
  updatePet,
  deletePet,
  listPets,
  getPet,
  createHealthRecord,
  deleteHealthRecord,
  getUpcomingHealthReminders,
} from './pets.service.js'

type PhotoFile = { buffer: Buffer; contentType: string; filename: string }

export async function petsRoutes(fastify: FastifyInstance) {
  await fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } })

  const auth = { onRequest: [fastify.authenticate] }

  // GET /pets
  fastify.get('/pets', auth, async (req, reply) => {
    const pets = await listPets(req.user.sub)
    return reply.send({ pets })
  })

  // POST /pets — multipart
  fastify.post('/pets', auth, async (req, reply) => {
    const parts = req.parts()
    const fields: Record<string, string> = {}
    let photoFile: { buffer: Buffer; contentType: string; filename: string } | undefined

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer()
        photoFile = { buffer, contentType: part.mimetype, filename: part.filename }
      } else {
        fields[part.fieldname] = part.value as string
      }
    }

    const parsed = CreatePetInputSchema.safeParse(fields)
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors })
    }

    const pet = await createPet(req.user.sub, parsed.data, photoFile)
    return reply.status(201).send({ pet })
  })

  // GET /pets/:id
  fastify.get('/pets/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string }
    const pet = await getPet(id, req.user.sub)
    return reply.send({ pet })
  })

  // PATCH /pets/:id — multipart
  fastify.patch('/pets/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string }
    const parts = req.parts()
    const fields: Record<string, string> = {}
    let photoFile: { buffer: Buffer; contentType: string; filename: string } | undefined

    for await (const part of parts) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer()
        photoFile = { buffer, contentType: part.mimetype, filename: part.filename }
      } else {
        fields[part.fieldname] = part.value as string
      }
    }

    const parsed = UpdatePetInputSchema.safeParse(fields)
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors })
    }

    const pet = await updatePet(id, req.user.sub, parsed.data, photoFile)
    return reply.send({ pet })
  })

  // DELETE /pets/:id
  fastify.delete('/pets/:id', auth, async (req, reply) => {
    const { id } = req.params as { id: string }
    await deletePet(id, req.user.sub)
    return reply.status(204).send()
  })

  // POST /pets/:id/health-records
  fastify.post('/pets/:id/health-records', auth, async (req, reply) => {
    const { id } = req.params as { id: string }
    const parsed = CreateHealthRecordInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ errors: parsed.error.flatten().fieldErrors })
    }
    const record = await createHealthRecord(id, req.user.sub, parsed.data)
    return reply.status(201).send({ record })
  })

  // DELETE /pets/:id/health-records/:recordId
  fastify.delete('/pets/:id/health-records/:recordId', auth, async (req, reply) => {
    const { recordId } = req.params as { id: string; recordId: string }
    await deleteHealthRecord(recordId, req.user.sub)
    return reply.status(204).send()
  })

  // GET /pets/reminders
  fastify.get('/pets/reminders', auth, async (req, reply) => {
    const reminders = await getUpcomingHealthReminders(req.user.sub)
    return reply.send({ reminders })
  })
}
