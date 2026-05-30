'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, PawPrint, Calendar, ChevronRight, Clock, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBookings } from '@/lib/hooks/useBookings'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/bookings'
import { DeniedToast } from '@/components/ui/denied-toast'

export default function TutorDashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Tutor'
  const { data: bookings = [] } = useBookings()

  const upcomingBookings = bookings.filter(
    (b) =>
      (b.status === 'PENDING' || b.status === 'CONFIRMED') &&
      new Date(b.scheduledAt) >= new Date(),
  )
  const pendingReviews = bookings.filter((b) => b.status === 'COMPLETED' && !b.review)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <DeniedToast />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Olá, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">O que você precisa hoje para o seu pet?</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Próximas reservas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Avaliações pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Serviços concluídos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5 text-primary" />
              Buscar serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Encontre prestadores verificados na sua região.
            </p>
            <Button asChild className="w-full">
              <Link href="/search">
                Buscar agora <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PawPrint className="h-5 w-5 text-primary" />
              Meus pets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gerencie cadastros, fichas de saúde e fotos.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/tutor/pets">
                Ver pets <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas reservas
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tutor/bookings">
              Ver todas <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma reserva próxima.
            </p>
          ) : (
            <div className="divide-y">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 ${STATUS_COLORS[booking.status]}`}
                      >
                        {STATUS_LABELS[booking.status]}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm truncate">{booking.service.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.provider.user.name} · {booking.pet.name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {format(new Date(booking.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/tutor/bookings/${booking.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending reviews */}
      {pendingReviews.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-yellow-500" />
              Avaliações pendentes ({pendingReviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {pendingReviews.slice(0, 3).map((booking) => (
                <div key={booking.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{booking.service.name}</p>
                    <p className="text-xs text-muted-foreground">{booking.provider.user.name}</p>
                  </div>
                  <Button size="sm" asChild>
                    <Link href={`/tutor/bookings/${booking.id}`}>Avaliar</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
