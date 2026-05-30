/**
 * email.ts — Envio de e-mails transacionais
 *
 * Development (NODE_ENV=development):
 *   Usa SMTP via nodemailer → Mailpit na porta 1025
 *   Interface visual: http://localhost:8025
 *
 * Production:
 *   Usa Resend SDK
 */

import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { marked } from 'marked'

const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'PetMatch <noreply@petmatch.com.br>'
const IS_DEV = process.env.NODE_ENV !== 'production'

// ── Transport abstraction ─────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (IS_DEV) {
    const host = process.env.SMTP_HOST ?? 'localhost'
    const port = parseInt(process.env.SMTP_PORT ?? '1025', 10)
    const transporter = nodemailer.createTransport({ host, port, secure: false })
    await transporter.sendMail({ from: FROM, to, subject, html })
    console.log(`[Email][DEV] Sent to ${to}: "${subject}" → smtp://${host}:${port}`)
    return
  }

  const key = process.env.RESEND_API_KEY ?? ''
  if (!key || key.includes('qualquer')) {
    console.warn(`[Email][PROD] RESEND_API_KEY not configured — skipping "${subject}" to ${to}`)
    return
  }

  const resend = new Resend(key)
  await resend.emails.send({ from: FROM, to, subject, html })
}

// ── HTML base layout ──────────────────────────────────────────────────────

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f5f5f5; margin:0; padding:0; }
    .wrapper { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header { background:#2563eb; padding:24px 32px; }
    .header h1 { color:#fff; margin:0; font-size:22px; }
    .header span { color:#bfdbfe; font-size:14px; }
    .body { padding:32px; color:#374151; line-height:1.6; }
    .body h2 { color:#111827; margin-top:0; }
    .detail-box { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin:20px 0; }
    .detail-box table { width:100%; border-collapse:collapse; }
    .detail-box td { padding:6px 0; vertical-align:top; }
    .detail-box td:first-child { font-weight:600; color:#6b7280; width:140px; }
    .btn { display:inline-block; background:#2563eb; color:#fff !important; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; margin-top:16px; }
    .briefing { background:#eff6ff; border-left:4px solid #2563eb; padding:16px; border-radius:0 8px 8px 0; margin:20px 0; font-size:15px; }
    .footer { text-align:center; padding:20px 32px; font-size:12px; color:#9ca3af; border-top:1px solid #f3f4f6; }
    .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:13px; font-weight:600; }
    .badge-green { background:#dcfce7; color:#166534; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🐾 PetMatch</h1>
      <span>Marketplace de serviços para pets em Balneário Camboriú</span>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      © ${new Date().getFullYear()} PetMatch · Balneário Camboriú, SC<br />
      <a href="${APP_URL}" style="color:#6b7280">Acessar plataforma</a>
    </div>
  </div>
</body>
</html>`
}

function fmtDate(d: Date): string {
  return d.toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtPrice(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface BookingEmailDetails {
  bookingId: string
  serviceName: string
  providerName: string
  tutorName: string
  petName: string
  scheduledAt: Date
  totalPrice: number
}

// ── Email functions ───────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  name: string,
  role: 'TUTOR' | 'PROVIDER',
): Promise<void> {
  const roleLabel = role === 'TUTOR' ? 'tutor' : 'prestador de serviços'
  const callToAction = role === 'TUTOR'
    ? `<a class="btn" href="${APP_URL}/tutor/dashboard">Explorar prestadores</a>`
    : `<a class="btn" href="${APP_URL}/provider/setup">Completar meu perfil</a>`
  const body = `
    <h2>Bem-vindo ao PetMatch, ${name}! 🎉</h2>
    <p>Estamos felizes em ter você como <strong>${roleLabel}</strong> na nossa plataforma.</p>
    ${role === 'TUTOR'
      ? '<p>Encontre os melhores cuidadores de pets em Balneário Camboriú com apenas alguns cliques.</p>'
      : '<p>Configure seu perfil, adicione seus serviços e comece a receber clientes hoje mesmo.</p>'}
    ${callToAction}
  `
  await sendEmail(to, 'Bem-vindo ao PetMatch! 🐾', layout('Bem-vindo', body))
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  const body = `
    <h2>Redefinição de senha</h2>
    <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
    <p>Clique no botão abaixo — o link expira em <strong>30 minutos</strong>.</p>
    <a class="btn" href="${resetUrl}">Redefinir senha</a>
    <p style="margin-top:24px;font-size:13px;color:#6b7280;">Se você não solicitou isso, pode ignorar este e-mail com segurança.</p>
  `
  await sendEmail(to, 'Redefinição de senha — PetMatch', layout('Redefinir senha', body))
}

export async function sendNewBookingRequestEmail(
  to: string,
  details: BookingEmailDetails & { briefing?: string },
): Promise<void> {
  const dashUrl = `${APP_URL}/provider/bookings`
  const body = `
    <h2>Nova solicitação de reserva! 🐾</h2>
    <p>Olá, <strong>${details.providerName}</strong>! Você recebeu uma nova solicitação de serviço.</p>
    <div class="detail-box">
      <table>
        <tr><td>Pet</td><td>${details.petName}</td></tr>
        <tr><td>Serviço</td><td>${details.serviceName}</td></tr>
        <tr><td>Tutor</td><td>${details.tutorName}</td></tr>
        <tr><td>Data</td><td>${fmtDate(details.scheduledAt)}</td></tr>
        <tr><td>Valor</td><td>${fmtPrice(details.totalPrice)}</td></tr>
      </table>
    </div>
    ${details.briefing ? `<p><strong>Briefing do pet (IA):</strong></p><div class="briefing">${marked.parse(details.briefing)}</div>` : ''}
    <a class="btn" href="${dashUrl}">Confirmar ou recusar</a>
  `
  await sendEmail(
    to,
    `Nova solicitação — ${details.petName} (${details.serviceName})`,
    layout('Nova solicitação', body),
  )
}

export async function sendBookingConfirmationEmail(
  to: string,
  details: BookingEmailDetails,
): Promise<void> {
  const bookingUrl = `${APP_URL}/tutor/bookings/${details.bookingId}`
  const body = `
    <h2>Agendamento confirmado! ✅</h2>
    <p>Olá, <strong>${details.tutorName}</strong>! Sua reserva foi confirmada.</p>
    <div class="detail-box">
      <table>
        <tr><td>Serviço</td><td>${details.serviceName}</td></tr>
        <tr><td>Prestador</td><td>${details.providerName}</td></tr>
        <tr><td>Pet</td><td>${details.petName}</td></tr>
        <tr><td>Data</td><td>${fmtDate(details.scheduledAt)}</td></tr>
        <tr><td>Total</td><td>${fmtPrice(details.totalPrice)}</td></tr>
      </table>
    </div>
    <a class="btn" href="${bookingUrl}">Ver reserva</a>
  `
  await sendEmail(
    to,
    `Reserva confirmada — ${details.serviceName}`,
    layout('Reserva confirmada', body),
  )
}

export async function sendBookingConfirmationProviderEmail(
  to: string,
  details: BookingEmailDetails,
): Promise<void> {
  const dashUrl = `${APP_URL}/provider/bookings/${details.bookingId}`
  const body = `
    <h2>Você confirmou uma reserva ✅</h2>
    <p>Olá, <strong>${details.providerName}</strong>! Sua confirmação foi registrada.</p>
    <div class="detail-box">
      <table>
        <tr><td>Serviço</td><td>${details.serviceName}</td></tr>
        <tr><td>Tutor</td><td>${details.tutorName}</td></tr>
        <tr><td>Pet</td><td>${details.petName}</td></tr>
        <tr><td>Data</td><td>${fmtDate(details.scheduledAt)}</td></tr>
        <tr><td>Total</td><td>${fmtPrice(details.totalPrice)}</td></tr>
      </table>
    </div>
    <a class="btn" href="${dashUrl}">Ver reserva</a>
  `
  await sendEmail(
    to,
    `Confirmação registrada — ${details.petName}`,
    layout('Confirmação registrada', body),
  )
}

export async function sendBookingRejectedEmail(
  to: string,
  details: BookingEmailDetails & { rejectionReason?: string },
): Promise<void> {
  const searchUrl = `${APP_URL}/search`
  const body = `
    <h2>Solicitação não aceita</h2>
    <p>Olá, <strong>${details.tutorName}</strong>. Infelizmente sua solicitação não foi aceita desta vez.</p>
    <div class="detail-box">
      <table>
        <tr><td>Serviço</td><td>${details.serviceName}</td></tr>
        <tr><td>Prestador</td><td>${details.providerName}</td></tr>
        <tr><td>Pet</td><td>${details.petName}</td></tr>
        <tr><td>Data solicitada</td><td>${fmtDate(details.scheduledAt)}</td></tr>
        ${details.rejectionReason ? `<tr><td>Motivo</td><td>${details.rejectionReason}</td></tr>` : ''}
      </table>
    </div>
    <p>Não se preocupe — temos outros ótimos prestadores disponíveis!</p>
    <a class="btn" href="${searchUrl}">Buscar outro prestador</a>
  `
  await sendEmail(
    to,
    `Solicitação não aceita — ${details.serviceName}`,
    layout('Solicitação não aceita', body),
  )
}

export async function sendBookingReminderEmail(
  to: string,
  details: BookingEmailDetails,
  hoursAhead: 24 | 2 = 24,
): Promise<void> {
  const bookingUrl = `${APP_URL}/tutor/bookings/${details.bookingId}`
  const timeLabel = hoursAhead === 24 ? 'amanhã' : 'em 2 horas'
  const icon = hoursAhead === 24 ? '📅' : '⏰'
  const body = `
    <h2>Lembrete de agendamento ${icon}</h2>
    <p>Olá, <strong>${details.tutorName}</strong>! Seu agendamento é <strong>${timeLabel}</strong>.</p>
    <div class="detail-box">
      <table>
        <tr><td>Serviço</td><td>${details.serviceName}</td></tr>
        <tr><td>Prestador</td><td>${details.providerName}</td></tr>
        <tr><td>Pet</td><td>${details.petName}</td></tr>
        <tr><td>Data</td><td>${fmtDate(details.scheduledAt)}</td></tr>
      </table>
    </div>
    <a class="btn" href="${bookingUrl}">Ver detalhes</a>
  `
  const subject = hoursAhead === 24
    ? `Lembrete: ${details.serviceName} amanhã`
    : `Lembrete: ${details.serviceName} em 2 horas`
  await sendEmail(to, subject, layout('Lembrete', body))
}

export async function sendReviewRequestEmail(
  to: string,
  details: BookingEmailDetails,
): Promise<void> {
  const reviewUrl = `${APP_URL}/tutor/bookings/${details.bookingId}`
  const body = `
    <h2>Como foi a experiência? ⭐</h2>
    <p>Olá, <strong>${details.tutorName}</strong>! O serviço de <strong>${details.serviceName}</strong> foi concluído.</p>
    <div class="detail-box">
      <table>
        <tr><td>Serviço</td><td>${details.serviceName}</td></tr>
        <tr><td>Prestador</td><td>${details.providerName}</td></tr>
        <tr><td>Pet</td><td>${details.petName}</td></tr>
      </table>
    </div>
    <p>Sua avaliação ajuda outros tutores a encontrar bons prestadores.</p>
    <a class="btn" href="${reviewUrl}">Avaliar agora</a>
  `
  await sendEmail(
    to,
    `Como foi o ${details.serviceName}? Deixe sua avaliação`,
    layout('Avaliação', body),
  )
}

export async function sendMessageNotificationEmail(
  to: string,
  recipientName: string,
  senderName: string,
  preview: string,
): Promise<void> {
  const msgUrl = `${APP_URL}/tutor/bookings`
  const safePreview = preview.substring(0, 150) + (preview.length > 150 ? '...' : '')
  const body = `
    <h2>Nova mensagem! 💬</h2>
    <p>Olá, <strong>${recipientName}</strong>! Você recebeu uma mensagem de <strong>${senderName}</strong>.</p>
    <blockquote style="border-left:3px solid #e5e7eb;margin:16px 0;padding:12px 16px;color:#6b7280;font-style:italic;">
      ${safePreview}
    </blockquote>
    <a class="btn" href="${msgUrl}">Responder</a>
  `
  await sendEmail(
    to,
    `Nova mensagem de ${senderName} — PetMatch`,
    layout('Nova mensagem', body),
  )
}

export async function sendProviderVerifiedEmail(to: string, name: string): Promise<void> {
  try {
    const body = `
      <h2>Conta verificada! ✅</h2>
      <p>Parabéns, <strong>${name}</strong>! Sua conta foi verificada com sucesso.</p>
      <p>A partir de agora você aparece com o badge <strong>Verificado</strong> nas buscas, aumentando sua visibilidade e a confiança dos tutores.</p>
      <a class="btn" href="${APP_URL}/provider/dashboard">Acessar painel</a>
    `
    await sendEmail(to, 'Sua conta foi verificada — PetMatch ✅', layout('Conta verificada', body))
  } catch {
    console.warn('[Email] sendProviderVerifiedEmail failed (non-fatal)')
  }
}

export async function sendProviderRejectedEmail(
  to: string,
  name: string,
  reason: string,
): Promise<void> {
  try {
    const body = `
      <h2>Verificação não aprovada</h2>
      <p>Olá, <strong>${name}</strong>. Infelizmente sua verificação não foi aprovada desta vez.</p>
      <div class="detail-box"><strong>Motivo:</strong><br />${reason}</div>
      <p>Você pode enviar um novo documento corrigindo o problema indicado acima.</p>
      <a class="btn" href="${APP_URL}/provider/setup">Reenviar documento</a>
    `
    await sendEmail(to, 'Verificação não aprovada — PetMatch', layout('Verificação', body))
  } catch {
    console.warn('[Email] sendProviderRejectedEmail failed (non-fatal)')
  }
}

export async function sendUserSuspendedEmail(
  to: string,
  name: string,
  reason: string,
): Promise<void> {
  try {
    const body = `
      <h2>Conta suspensa</h2>
      <p>Olá, <strong>${name}</strong>. Sua conta foi suspensa pela equipe do PetMatch.</p>
      <div class="detail-box"><strong>Motivo:</strong><br />${reason}</div>
      <p>Se acreditar que isso foi um engano, entre em contato com nosso suporte.</p>
    `
    await sendEmail(to, 'Conta suspensa — PetMatch', layout('Conta suspensa', body))
  } catch {
    console.warn('[Email] sendUserSuspendedEmail failed (non-fatal)')
  }
}
