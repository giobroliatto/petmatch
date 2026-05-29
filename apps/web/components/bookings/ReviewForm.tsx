'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Star, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useCreateReview } from '@/lib/hooks/useBookings'

interface ReviewFormProps {
  bookingId: string
  onSuccess?: () => void
}

export function ReviewForm({ bookingId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const createReview = useCreateReview()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Selecione uma nota de 1 a 5 estrelas')
      return
    }
    try {
      await createReview.mutateAsync({ bookingId, rating, comment: comment.trim() || undefined })
      toast.success('Avaliação enviada! Obrigado pelo feedback.')
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar avaliação')
    }
  }

  const display = hovered || rating

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Sua nota</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= display
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground">
            {['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Comentário (opcional)</Label>
        <Textarea
          id="review-comment"
          placeholder="Descreva sua experiência com este prestador..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
      </div>

      <Button type="submit" disabled={rating === 0 || createReview.isPending} className="w-full">
        {createReview.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Enviando...
          </>
        ) : (
          'Enviar avaliação'
        )}
      </Button>
    </form>
  )
}
