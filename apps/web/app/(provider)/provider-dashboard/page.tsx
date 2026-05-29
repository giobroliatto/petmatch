'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Star, MapPin, CheckCircle, ChevronRight, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMyProviderProfile } from '@/lib/hooks/useProviders'
import { formatPrice, SERVICE_TYPE_LABELS, DAYS_OF_WEEK } from '@/lib/providers'

export default function ProviderDashboardPage() {
  const { data: session } = useSession()
  const { data: profile, isLoading, error } = useMyProviderProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-destructive">Erro ao carregar perfil. Tente novamente.</p>
      </div>
    )
  }

  const activeServices = profile.services.filter((s) => s.active)
  const firstName = session?.user?.name?.split(' ')[0] ?? profile.user.name.split(' ')[0]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Olá, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Aqui está um resumo do seu perfil</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/provider/${profile.id}`}>Ver perfil público</Link>
          </Button>
          <Button asChild>
            <Link href="/provider/services">Gerenciar serviços</Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold">
                {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avaliação média</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{profile.totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">Avaliações recebidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeServices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Serviços ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{profile.qualityTags.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tags de qualidade IA</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-1 space-y-4">
          {/* Profile card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meu perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {profile.user.avatarUrl ? (
                  <img
                    src={profile.user.avatarUrl}
                    alt={profile.user.name}
                    className="h-14 w-14 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground">
                    {profile.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{profile.user.name}</p>
                  {profile.city && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {profile.city}{profile.state ? `, ${profile.state}` : ''}
                    </p>
                  )}
                  {profile.verified ? (
                    <Badge variant="secondary" className="text-xs mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" /> Verificado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs mt-1 text-muted-foreground">
                      Não verificado
                    </Badge>
                  )}
                </div>
              </div>

              {profile.bio && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground line-clamp-4">{profile.bio}</p>
                </>
              )}

              {profile.qualityTags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium mb-2">Tags de qualidade IA</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.qualityTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs text-green-700 border-green-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Availability */}
          {profile.availability.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Disponibilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {profile.availability.map((a) => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-8">{DAYS_OF_WEEK[a.dayOfWeek]}</span>
                      <span>{a.startTime} – {a.endTime}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-6">
          {/* Active services */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Serviços ativos</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/provider/services">
                  Gerenciar <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activeServices.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum serviço ativo.{' '}
                  <Link href="/provider/services" className="underline">
                    Adicione um agora.
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {activeServices.map((service) => (
                    <div key={service.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] ?? service.type}
                          {service.homeVisit && ' · Domiciliar'}
                          {' · '}{service.durationMin} min
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{formatPrice(service.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent reviews */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Avaliações recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma avaliação ainda.
                </p>
              ) : (
                <div className="divide-y">
                  {profile.reviews.map((review) => (
                    <div key={review.id} className="py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {review.booking.tutor.user.name}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

