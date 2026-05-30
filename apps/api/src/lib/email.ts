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
  const reviewUrl = `${APP_URL}/tutor/bookings`
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

export async function sendNewBookingRequestEmail(
  to: string,
  details: BookingEmailDetails & { briefing?: string },
): Promise<void> {
  const { resend, from } = getClient()
  const dashUrl = `${APP_URL}/provider/dashboard`
  await resend.emails.send({
    from,
    to,
    subject: `Nova solicitação de reserva — ${details.petName}`,
    html: `
      <h1>Nova solicitação de reserva! 🐾</h1>
      <p>Olá, ${details.providerName}! Você recebeu uma nova solicitação.</p>
      <ul>
        <li><strong>Pet:</strong> ${details.petName}</li>
        <li><strong>Serviço:</strong> ${details.serviceName}</li>
        <li><strong>Tutor:</strong> ${details.tutorName}</li>
        <li><strong>Data:</strong> ${details.scheduledAt.toLocaleString('pt-BR')}</li>
        <li><strong>Total:</strong> R$ ${details.totalPrice.toFixed(2)}</li>
      </ul>
      ${details.briefing ? `<p><strong>Briefing IA:</strong> ${details.briefing}</p>` : ''}
      <p><a href="${dashUrl}">Confirmar ou recusar</a></p>
    `,
  })
}

export async function sendBookingRejectedEmail(
  to: string,
  details: BookingEmailDetails & { rejectionReason?: string },
): Promise<void> {
  const { resend, from } = getClient()
  await resend.emails.send({
    from,
    to,
    subject: `Solicitação não aceita — ${details.serviceName}`,
    html: `
      <h1>Solicitação não aceita</h1>
      <p>Olá, ${details.tutorName}! Infelizmente sua solicitação não foi aceita.</p>
      <ul>
        <li><strong>Serviço:</strong> ${details.serviceName}</li>
        <li><strong>Prestador:</strong> ${details.providerName}</li>
        <li><strong>Pet:</strong> ${details.petName}</li>
        <li><strong>Data:</strong> ${details.scheduledAt.toLocaleString('pt-BR')}</li>
      </ul>
      ${details.rejectionReason ? `<p><strong>Motivo:</strong> ${details.rejectionReason}</p>` : ''}
    `,
  })
}

export async function sendMessageNotificationEmail(
  to: string,
  recipientName: string,
  senderName: string,
  preview: string,
): Promise<void> {
  const { resend, from } = getClient()
  const msgUrl = `${APP_URL}/tutor/bookings`
  const safePreview = preview.substring(0, 150) + (preview.length > 150 ? '...' : '')
  await resend.emails.send({
    from,
    to,
    subject: `Nova mensagem de ${senderName} — PetMatch`,
    html: `
      <h1>Nova mensagem! 💬</h1>
      <p>Olá, ${recipientName}! Você recebeu uma mensagem de ${senderName}.</p>
      <blockquote>${safePreview}</blockquote>
      <p><a href="${msgUrl}">Ver mensagem</a></p>
    `,
  })
}

export async function sendProviderVerifiedEmail(to: string, name: string): Promise<void> {
  try {
    const { resend, from } = getClient()
    await resend.emails.send({
      from,
      to,
      subject: 'Sua conta foi verificada — PetMatch',
      html: `
        <h1>Parabéns, ${name}! ✅</h1>
        <p>Sua conta foi verificada. Você agora aparece como prestador verificado nas buscas.</p>
        <p><a href="${APP_URL}/provider/dashboard">Acessar painel</a></p>
      `,
    })
  } catch {
    console.warn('sendProviderVerifiedEmail: email not sent (missing credentials)')
  }
}

export async function sendProviderRejectedEmail(to: string, name: string, reason: string): Promise<void> {
  try {
    const { resend, from } = getClient()
    await resend.emails.send({
      from,
      to,
      subject: 'Verificação não aprovada — PetMatch',
      html: `
        <h1>Verificação não aprovada</h1>
        <p>Olá, ${name}. Infelizmente sua verificação não foi aprovada.</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p>Você pode enviar um novo documento acessando seu perfil.</p>
        <p><a href="${APP_URL}/provider/setup">Reenviar documento</a></p>
      `,
    })
  } catch {
    console.warn('sendProviderRejectedEmail: email not sent (missing credentials)')
  }
}

export async function sendUserSuspendedEmail(to: string, name: string, reason: string): Promise<void> {
  try {
    const { resend, from } = getClient()
    await resend.emails.send({
      from,
      to,
      subject: 'Conta suspensa — PetMatch',
      html: `
        <h1>Conta suspensa</h1>
        <p>Olá, ${name}. Sua conta foi suspensa.</p>
        <p><strong>Motivo:</strong> ${reason}</p>
        <p>Entre em contato com o suporte se acreditar que isso foi um engano.</p>
      `,
    })
  } catch {
    console.warn('sendUserSuspendedEmail: email not sent (missing credentials)')
  }
}
