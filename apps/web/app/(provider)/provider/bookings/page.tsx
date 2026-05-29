'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, ChevronRight, PawPrint, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBookings } from '@/lib/hooks/useBookings'
import { STATUS_LABELS, STATUS_COLORS, type BookingStatus } from '@/lib/bookings'
import { formatPrice } from '@/lib/providers'

const STATUS_TABS: Array<{ label: string; value: BookingStatus | undefined }> = [
  { label: 'Todos', value: undefined },
  { label: 'Pendentes', value: 'PENDING' },
  { label: 'Confirmados', value: 'CONFIRMED' },
  { label: 'Concluídos', value: 'COMPLETED' },
  { label: 'Cancelados', value: 'CANCELLED' },
]

export default function ProviderBookingsPage() {
  const [activeStatus, setActiveStatus] = useState<BookingStatus | undefined>(undefined)
  const { data: bookings = [], isLoading, error } = useBookings(activeStatus)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Minhas reservas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Acompanhe e gerencie os agendamentos dos seus clientes
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              activeStatus === tab.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Carregando reservas...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-destructive">Erro ao carregar reservas.</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma reserva encontrada</p>
          <p className="text-sm mt-1">
            {activeStatus
              ? 'Tente outro filtro de status.'
              : 'Seus clientes ainda não fizeram reservas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 ${STATUS_COLORS[booking.status]}`}
                      >
                        {STATUS_LABELS[booking.status]}
                      </Badge>
                    </div>
                    <p className="font-semibold truncate">{booking.service.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Tutor: {booking.tutor.user.name}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <PawPrint className="h-3.5 w-3.5" />
                        {booking.pet.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(booking.scheduledAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-semibold">{formatPrice(booking.totalPrice)}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/provider/bookings/${booking.id}`}>
                        Ver <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
