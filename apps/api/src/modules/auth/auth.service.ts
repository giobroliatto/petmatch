import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma.js'
import { redis } from '../../lib/redis.js'
import { sendWelcomeEmail, sendPasswordResetEmail } from '../../lib/email.js'
import type { RegisterInput, LoginInput } from './auth.schema.js'

const BCRYPT_ROUNDS = 12
const RESET_TOKEN_TTL = 60 * 30 // 30 minutes in seconds

function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  // Use crypto for secure random generation
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  for (const byte of array) {
    token += chars[byte % chars.length]
  }
  return token
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new Error('E-mail já cadastrado')
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      roles: [input.role],
      ...(input.role === 'TUTOR'
        ? { tutorProfile: { create: {} } }
        : { providerProfile: { create: {} } }),
    },
    select: { id: true, name: true, email: true, roles: true, createdAt: true },
  })

  await sendWelcomeEmail(user.email, user.name, input.role).catch(() => {
    // Non-fatal: log but don't fail registration
  })

  return user
}

export async function login(
  input: LoginInput,
  signFn: (payload: object) => string,
): Promise<{ token: string; user: { id: string; name: string; email: string; roles: string[] } }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user || !user.passwordHash) {
    throw new Error('Credenciais inválidas')
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) {
    throw new Error('Credenciais inválidas')
  }

  const token = signFn({ sub: user.id, roles: user.roles })

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, roles: user.roles as string[] },
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } })
  // Always respond the same way to prevent user enumeration
  if (!user) return

  const token = generateResetToken()
  await redis.set(`pwd_reset:${token}`, user.id, 'EX', RESET_TOKEN_TTL)
  await sendPasswordResetEmail(email, token).catch(() => {
    // Non-fatal
  })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const userId = await redis.get(`pwd_reset:${token}`)
  if (!userId) {
    throw new Error('Token inválido ou expirado')
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  await redis.del(`pwd_reset:${token}`)
}
