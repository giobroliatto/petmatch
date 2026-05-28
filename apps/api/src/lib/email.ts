import { Resend } from 'resend'

const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return {
    resend: new Resend(process.env.RESEND_API_KEY),
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@seudominio.com.br',
  }
}

export interface BookingEmailDetails {
  bookingId: string
  serviceName: string
  providerName: string
  tutorName: string
  petName: string
  scheduledAt: Date
  totalPrice: number
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: 'TUTOR' | 'PROVIDER',
): Promise<void> {
  const { resend, from } = getClient()
  const roleLabel = role === 'TUTOR' ? 'tutor' : 'prestador de serviços'
  await resend.emails.send({
    from,
    to,
    subject: 'Bem-vindo ao PetMatch! 🐾',
    html: `
      <h1>Olá, ${name}!</h1>
      <p>Seja bem-vindo ao <strong>PetMatch</strong> como ${roleLabel}.</p>
      <p>Acesse sua conta em: <a href="${APP_URL}">${APP_URL}</a></p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const { resend, from } = getClient()
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  await resend.emails.send({
    from,
    to,
    subject: 'Redefinição de senha — PetMatch',
    html: `
      <h1>Redefinição de senha</h1>
      <p>Use o link abaixo para redefinir sua senha. Ele expira em 30 minutos.</p>
      <p><a href="${resetUrl}">Redefinir senha</a></p>
      <p>Se você não solicitou a redefinição, ignore este e-mail.</p>
    `,
  })
}

export async function sendBookingConfirmationEmail(
  to: string,
  details: BookingEmailDetails,
): Promise<void> {
  const { resend, from } = getClient()
  await resend.emails.send({
    from,
    to,
    subject: `Agendamento confirmado — ${details.serviceName}`,
    html: `
      <h1>Agendamento confirmado! 🎉</h1>
      <p>Olá, ${details.tutorName}!</p>
      <ul>
        <li><strong>Serviço:</strong> ${details.serviceName}</li>
        <li><strong>Prestador:</strong> ${details.providerName}</li>
        <li><strong>Pet:</strong> ${details.petName}</li>
        <li><strong>Data:</strong> ${details.scheduledAt.toLocaleString('pt-BR')}</li>
        <li><strong>Total:</strong> R$ ${details.totalPrice.toFixed(2)}</li>
      </ul>
    `,
  })
}

export async function sendBookingReminderEmail(
  to: string,
  details: BookingEmailDetails,
): Promise<void> {
  const { resend, from } = getClient()
  await resend.emails.send({
    from,
    to,
    subject: `Lembrete: ${details.serviceName} amanhã`,
    html: `
      <h1>Lembrete de agendamento ⏰</h1>
      <p>Olá, ${details.tutorName}! Seu agendamento é amanhã.</p>
      <ul>
        <li><strong>Serviço:</strong> ${details.serviceName}</li>
        <li><strong>Prestador:</strong> ${details.providerName}</li>
        <li><strong>Pet:</strong> ${details.petName}</li>
        <li><strong>Data:</strong> ${details.scheduledAt.toLocaleString('pt-BR')}</li>
      </ul>
    `,
  })
}

export async function sendReviewRequestEmail(
  to: string,
  details: BookingEmailDetails,
): Promise<void> {
  const { resend, from } = getClient()
  const reviewUrl = `${APP_URL}/tutor/dashboard`
  await resend.emails.send({
    from,
    to,
    subject: `Como foi o ${details.serviceName}? Deixe sua avaliação`,
    html: `
      <h1>Como foi a experiência? ⭐</h1>
      <p>Olá, ${details.tutorName}! O serviço de ${details.serviceName} foi concluído.</p>
      <p>Avalie ${details.providerName}: <a href="${reviewUrl}">Deixar avaliação</a></p>
    `,
  })
}
