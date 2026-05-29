'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  PawPrint,
  MessageSquare,
  Loader2,
  CheckCircle,
  XCircle,
  Flag,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useBooking, useConfirmBooking, useRejectBooking, useCompleteBooking } from '@/lib/hooks/useBookings'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/bookings'
import { formatPrice } from '@/lib/providers'
import { BookingChat } from '@/components/bookings/BookingChat'

const CHAT_ENABLED_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS']

export default function ProviderBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: session } = useSession()
  const { data: booking, isLoading, error } = useBooking(id)
  const confirmBooking = useConfirmBooking()
  const rejectBooking = useRejectBooking()
  const completeBooking = useCompleteBooking()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const currentUserId = session?.user?.id ?? ''
  const isChatEnabled = booking ? CHAT_ENABLED_STATUSES.includes(booking.status) : false

  async function handleConfirm() {
    try {
      await confirmBooking.mutateAsync(id)
      toast.success('Reserva confirmada! O tutor será notificado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao confirmar')
    }
  }

  async function handleReject() {
    try {
      await rejectBooking.mutateAsync({ id, reason: rejectReason.trim() || undefined })
      toast.success('Reserva recusada.')
      setShowRejectForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao recusar')
    }
  }

  async function handleComplete() {
    if (!confirm('Confirmar conclusão desta reserva?')) return
    try {
      await completeBooking.mutateAsync(id)
      toast.success('Reserva marcada como concluída!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao concluir')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando reserva...
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-destructive">Reserva não encontrada.</p>
        <Button variant="outline" asChild>
          <Link href="/provider/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao painel
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/provider/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{booking.service.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 ${STATUS_COLORS[booking.status]}`}
            >
              {STATUS_LABELS[booking.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              #{booking.id.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Booking info + actions */}
        <div className="md:col-span-1 space-y-4">
          {/* Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Tutor</p>
                <p className="font-medium">{booking.tutor.user.name}</p>
                <p className="text-muted-foreground text-xs">{booking.tutor.user.email}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Pet</p>
                <p className="font-medium flex items-center gap-1">
                  <PawPrint className="h-3.5 w-3.5" />
                  {booking.pet.name}
                </p>
                <p className="text-muted-foreground text-xs capitalize">
                  {booking.pet.species.toLowerCase()}
                  {booking.pet.breed ? ` · ${booking.pet.breed}` : ''}
                  {booking.pet.weightKg ? ` · ${booking.pet.weightKg}kg` : ''}
                  {booking.pet.neutered ? ' · castrado' : ''}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Agendado para
                </p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(booking.scheduledAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-base">{formatPrice(booking.totalPrice)}</span>
              </div>

              {booking.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                      Observações do tutor
                    </p>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {booking.status === 'PENDING' && !showRejectForm && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={confirmBooking.isPending}
                >
                  {confirmBooking.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmar reserva
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Recusar reserva
                </Button>
              </CardContent>
            </Card>
          )}

          {booking.status === 'PENDING' && showRejectForm && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <Label htmlFor="reject-reason">Motivo da recusa (opcional)</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Ex: sem disponibilidade nesta data..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleReject}
                    disabled={rejectBooking.isPending}
                  >
                    {rejectBooking.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Confirmar recusa'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {booking.status === 'CONFIRMED' && (
            <Card>
              <CardContent className="pt-4">
                <Button
                  className="w-full"
                  onClick={handleComplete}
                  disabled={completeBooking.isPending}
                >
                  {completeBooking.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  Marcar como concluído
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AI Briefing */}
          {booking.briefing && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Briefing IA do pet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {booking.briefing}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Chat */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat com o tutor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">
              <BookingChat
                bookingId={booking.id}
                currentUserId={currentUserId}
                disabled={!isChatEnabled}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
