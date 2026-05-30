import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Star, CheckCircle2, Clock, Home, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SERVICE_TYPE_LABELS, DAYS_OF_WEEK, formatPrice } from '@/lib/providers'
import type { ProviderFullProfile } from '@/lib/providers'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function fetchProvider(id: string): Promise<ProviderFullProfile | null> {
  try {
    const res = await fetch(`${API_URL}/providers/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { provider: ProviderFullProfile }
    return data.provider
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const provider = await fetchProvider(id)
  if (!provider) return { title: 'Prestador não encontrado | PetMatch BC' }
  const primaryService = provider.services[0]
  const title = `${provider.name}${primaryService ? ` — ${primaryService.name}` : ''}${provider.city ? ` em ${provider.city}` : ''} | PetMatch BC`
  const description = provider.bio
    ? provider.bio.substring(0, 160)
    : `Prestador de serviços pet${provider.city ? ` em ${provider.city}` : ''}. Avaliação ${provider.averageRating.toFixed(1)}/5.`
  return {
    title,
    description,
    openGraph: { title, description, images: provider.avatarUrl ? [provider.avatarUrl] : [] },
  }
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/providers/featured/Balne%C3%A1rio%20Cambori%C3%BA`)
    if (!res.ok) return []
    const data = (await res.json()) as { providers: { id: string }[] }
    return data.providers.map(p => ({ id: p.id }))
  } catch {
    return []
  }
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const full = Math.floor(rating)
  const partial = rating - full
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && partial >= 0.5)
        return (
          <Star
            key={i}
            className={`${cls} ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        )
      })}
    </span>
  )
}

export default async function ProviderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const provider = await fetchProvider(id)

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="font-medium">Prestador não encontrado</p>
        <Button variant="outline" asChild>
          <Link href="/search">Voltar à busca</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href="/search">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="bg-card border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {provider.avatarUrl ? (
            <img
              src={provider.avatarUrl}
              alt={provider.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-background shadow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground border-4 border-background shadow">
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{provider.name}</h1>
              {provider.verified && (
                <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Verificado
                </span>
              )}
            </div>
            {provider.city && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {provider.city}{provider.state ? `, ${provider.state}` : ''}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={provider.averageRating} />
              <span className="font-semibold">{provider.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">
                ({provider.totalReviews} avaliação{provider.totalReviews !== 1 ? 'ões' : ''})
              </span>
            </div>
            {provider.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{provider.bio}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {provider.qualityTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {provider.qualityTags.map(tag => (
              <span key={tag} className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                {tag}
              </span>
            ))}
          </div>
        )}

        {provider.services.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Serviços oferecidos</CardTitle></CardHeader>
            <CardContent className="divide-y p-0">
              {provider.services.map(service => (
                <div key={service.id} className="flex items-start justify-between p-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{service.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {SERVICE_TYPE_LABELS[service.type] ?? service.type}
                      </Badge>
                      {service.homeVisit && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Home className="h-3 w-3" /> Atende a domicílio
                        </span>
                      )}
                    </div>
                    {service.description && <p className="text-xs text-muted-foreground mt-1">{service.description}</p>}
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {service.durationMin} min
                    </p>
                  </div>
                  <p className="font-semibold text-sm text-primary shrink-0">{formatPrice(service.price)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {provider.availability.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Disponibilidade</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {provider.availability.map(slot => (
                  <div key={slot.id} className="flex flex-col items-center p-2 rounded-lg bg-muted text-center text-sm">
                    <span className="font-medium">{DAYS_OF_WEEK[slot.dayOfWeek]}</span>
                    <span className="text-xs text-muted-foreground">{slot.startTime} – {slot.endTime}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {provider.galleryUrls.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Galeria</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {provider.galleryUrls.map((url, i) => (
                <img key={i} src={url} alt={`Foto ${i + 1} — ${provider.name}`} className="rounded-lg object-cover aspect-square w-full" />
              ))}
            </div>
          </div>
        )}

        {provider.reviews.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Avaliações ({provider.totalReviews})</h2>
            <div className="space-y-4">
              {provider.reviews.map(review => (
                <Card key={review.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                        {review.booking.tutor.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{review.booking.tutor.user.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                        {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                      </div>
                    </div>
                    {review.providerReply && (
                      <>
                        <Separator />
                        <div className="pl-11">
                          <p className="text-xs font-medium mb-1">Resposta do prestador</p>
                          <p className="text-xs text-muted-foreground">{review.providerReply}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            {provider.services.length > 0 && (
              <p className="text-sm text-muted-foreground">
                a partir de{' '}
                <span className="font-semibold text-foreground">
                  {formatPrice(Math.min(...provider.services.map(s => s.price)))}
                </span>
              </p>
            )}
          </div>
          <Button asChild className="gap-2">
            <Link href={`/tutor/bookings/new?providerId=${provider.id}`}>Agendar serviço</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}