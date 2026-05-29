import Link from 'next/link'
import { MapPin, Star, CheckCircle2, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SERVICE_TYPE_LABELS, formatPrice, type ProviderCardData } from '@/lib/providers'

interface ProviderCardProps {
  provider: ProviderCardData
  aiMode?: boolean
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const partial = rating - full
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && partial >= 0.5)
        return (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        )
      })}
    </span>
  )
}

export function ProviderCard({ provider, aiMode = false }: ProviderCardProps) {
  const minPrice =
    provider.minPrice ?? (provider.services && provider.services.length > 0
      ? Math.min(...provider.services.map(s => s.price))
      : null)

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col gap-3 p-4 h-full">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {provider.avatarUrl ? (
              <img
                src={provider.avatarUrl}
                alt={provider.name}
                className="w-14 h-14 rounded-full object-cover border"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground">
                {provider.name.charAt(0).toUpperCase()}
              </div>
            )}
            {provider.verified && (
              <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{provider.name}</h3>
            {provider.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {provider.city}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1">
              <StarRating rating={provider.averageRating} />
              <span className="text-xs text-muted-foreground">
                {provider.averageRating.toFixed(1)}
                {provider.totalReviews > 0 && ` (${provider.totalReviews})`}
              </span>
            </div>
          </div>
          {minPrice !== null && (
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">a partir de</p>
              <p className="text-sm font-semibold text-primary">{formatPrice(minPrice)}</p>
            </div>
          )}
        </div>

        {/* Service type badges */}
        {provider.serviceTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {provider.serviceTypes.slice(0, 4).map(type => (
              <Badge key={type} variant="secondary" className="text-xs">
                {SERVICE_TYPE_LABELS[type] ?? type}
              </Badge>
            ))}
          </div>
        )}

        {/* Quality tags */}
        {provider.qualityTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {provider.qualityTags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* AI match reason */}
        {aiMode && provider.matchReason && (
          <div className="flex items-start gap-2 bg-blue-50 text-blue-800 rounded-md px-3 py-2 text-xs border border-blue-200">
            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p className="line-clamp-2">{provider.matchReason}</p>
          </div>
        )}

        {/* AI match score */}
        {aiMode && provider.matchScore !== undefined && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${provider.matchScore}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums">{provider.matchScore}%</span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1">
          <Button asChild size="sm" className="w-full">
            <Link href={`/provider/${provider.id}`}>Ver perfil</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
