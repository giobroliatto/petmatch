'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Users, Building2, Calendar, ShieldAlert, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getStats, type PlatformStats } from '@/lib/admin'

export default function AdminDashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.accessToken) return
    getStats(session.user.accessToken)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendentes',
    CONFIRMED: 'Confirmados',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluídos',
    CANCELLED: 'Cancelados',
    REJECTED: 'Rejeitados',
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da plataforma PetMatch</p>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários</p>
                <p className="text-3xl font-bold">{stats?.totalUsers ?? '—'}</p>
              </div>
              <Users className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prestadores</p>
                <p className="text-3xl font-bold">{stats?.totalProviders ?? '—'}</p>
              </div>
              <Building2 className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservas (este mês)</p>
                <p className="text-3xl font-bold">{stats?.bookingsThisMonth ?? '—'}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de reservas</p>
                <p className="text-3xl font-bold">{stats?.totalBookings ?? '—'}</p>
              </div>
              <Calendar className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
          </CardContent>
        </Card>

        <Card className={(stats?.pendingVerifications ?? 0) > 0 ? 'border-yellow-400 bg-yellow-50/50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verificações pendentes</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-3xl font-bold">{stats?.pendingVerifications ?? '—'}</p>
                  {(stats?.pendingVerifications ?? 0) > 0 && (
                    <Badge className="bg-yellow-500 text-white border-0 text-xs">Atenção</Badge>
                  )}
                </div>
              </div>
              <ShieldAlert className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings by status */}
      {stats?.bookingsByStatus && Object.keys(stats.bookingsByStatus).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Reservas por status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(stats.bookingsByStatus).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{statusLabels[status] ?? status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/admin/verifications">Fila de verificações</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/users">Gerenciar usuários</Link>
        </Button>
      </div>
    </div>
  )
}
