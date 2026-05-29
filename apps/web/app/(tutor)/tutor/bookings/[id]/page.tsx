'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  PawPrint,
  Star,
  MessageSquare,
  Loader2,
  XCircle,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useBooking, useCancelBooking } from '@/lib/hooks/useBookings'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/bookings'
import { formatPrice } from '@/lib/providers'
import { BookingChat } from '@/components/bookings/BookingChat'
import { ReviewForm } from '@/components/bookings/ReviewForm'

const CHAT_ENABLED_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
const TERMINAL_STATUSES = ['COMPLETED', 'CANCELLED', 'REJECTED']

export default function TutorBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const { data: booking, isLoading, error } = useBooking(id)
  const cancelBooking = useCancelBooking()

  const currentUserId = session?.user?.id ?? ''
  const isChatEnabled = booking ? CHAT_ENABLED_STATUSES.includes(booking.status) : false
  const canCancel = booking && ['PENDING', 'CONFIRMED'].includes(booking.status)
  const showReviewForm = booking?.status === 'COMPLETED' && !booking.review

  async function handleCancel() {
    if (!confirm('Confirmar cancelamento desta reserva?')) return
    try {
      await cancelBooking.mutateAsync(id)
      toast.success('Reserva cancelada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar')
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
          <Link href="/tutor/bookings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
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
          <Link href="/tutor/bookings">
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
        {/* Left: Booking info */}
        <div className="md:col-span-1 space-y-4">
          {/* Details card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Prestador
                </p>
                <p className="font-medium">{booking.provider.user.name}</p>
                {booking.provider.city && (
                  <p className="text-muted-foreground">{booking.provider.city}</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Pet
                </p>
                <p className="font-medium flex items-center gap-1">
                  <PawPrint className="h-3.5 w-3.5" />
                  {booking.pet.name}
                </p>
                <p className="text-muted-foreground text-xs capitalize">
                  {booking.pet.species.toLowerCase()}{booking.pet.breed ? ` · ${booking.pet.breed}` : ''}
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
                      Suas observações
                    </p>
                    <p className="text-sm">{booking.notes}</p>
                  </div>
                </>
              )}

              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive mt-2"
                  onClick={handleCancel}
                  disabled={cancelBooking.isPending}
                >
                  {cancelBooking.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Cancelar reserva
                </Button>
              )}
            </CardContent>
          </Card>

          {/* AI Briefing */}
          {booking.briefing && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Briefing gerado por IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {booking.briefing}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Review (if exists) */}
          {booking.review && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  Sua avaliação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= booking.review!.rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                {booking.review.comment && (
                  <p className="text-sm text-muted-foreground">{booking.review.comment}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Chat + Review form */}
        <div className="md:col-span-2 space-y-6">
          {/* Chat */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat com o prestador
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

          {/* Review form */}
          {showReviewForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Avaliar prestador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm bookingId={booking.id} />
              </CardContent>
            </Card>
          )}

          {booking.status === 'COMPLETED' && booking.review && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Você já avaliou este serviço.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
