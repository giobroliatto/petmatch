'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, PawPrint, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useProviderProfile } from '@/lib/hooks/useProviders'
import { usePets } from '@/lib/hooks/usePets'
import { useCreateBooking } from '@/lib/hooks/useBookings'
import { formatPrice, SERVICE_TYPE_LABELS } from '@/lib/providers'

const bookingSchema = z.object({
  serviceId: z.string().min(1, 'Selecione um serviço'),
  petId: z.string().min(1, 'Selecione um pet'),
  scheduledAt: z.string().min(1, 'Informe a data e hora'),
  notes: z.string().max(1000).optional(),
})
type BookingFormValues = z.infer<typeof bookingSchema>

export default function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ providerId?: string }>
}) {
  const { providerId } = use(searchParams)
  const router = useRouter()
  const { data: provider, isLoading: loadingProvider } = useProviderProfile(providerId ?? '')
  const { data: pets = [], isLoading: loadingPets } = usePets()
  const createBooking = useCreateBooking()

  // Min datetime: 1 hour from now
  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema as any),
    defaultValues: { serviceId: '', petId: '', scheduledAt: '', notes: '' },
  })

  async function onSubmit(values: BookingFormValues) {
    if (!providerId) return
    try {
      const booking = await createBooking.mutateAsync({
        providerId,
        petId: values.petId,
        serviceId: values.serviceId,
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        notes: values.notes || undefined,
      })
      toast.success('Reserva criada! Aguardando confirmação do prestador.')
      router.push(`/tutor/bookings/${booking.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar reserva')
    }
  }

  if (!providerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Nenhum prestador selecionado.</p>
        <Button asChild>
          <Link href="/search">Buscar prestadores</Link>
        </Button>
      </div>
    )
  }

  if (loadingProvider || loadingPets) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando...
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-destructive">Prestador não encontrado.</p>
        <Button variant="outline" asChild>
          <Link href="/search">Voltar à busca</Link>
        </Button>
      </div>
    )
  }

  const activeServices = provider.services.filter((s) => s.active)

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/provider/${providerId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Agendar serviço</h1>
          <p className="text-sm text-muted-foreground">{provider.name}</p>
        </div>
      </div>

      {/* No pets warning */}
      {pets.length === 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900/50">
          <CardContent className="pt-4 flex gap-3 items-start">
            <PawPrint className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-yellow-800 dark:text-yellow-300">
                Nenhum pet cadastrado
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                Cadastre um pet antes de agendar.{' '}
                <Link href="/tutor/pets" className="underline font-medium">
                  Adicionar pet
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No services warning */}
      {activeServices.length === 0 && (
        <Card className="mb-6 border-destructive/30">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground text-center">
              Este prestador não possui serviços ativos no momento.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Detalhes do agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Service */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um serviço..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <span className="flex items-center justify-between gap-3 w-full">
                              <span>{service.name}</span>
                              <span className="text-muted-foreground text-xs">
                                {SERVICE_TYPE_LABELS[service.type as keyof typeof SERVICE_TYPE_LABELS] ?? service.type}
                                {' · '}
                                {formatPrice(service.price)}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pet */}
              <FormField
                control={form.control}
                name="petId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={pets.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={pets.length === 0 ? 'Nenhum pet cadastrado' : 'Selecione um pet...'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name}{' '}
                            <span className="text-muted-foreground text-xs capitalize">
                              · {pet.species.toLowerCase()}{pet.breed ? ` · ${pet.breed}` : ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date/time */}
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e hora</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        min={minDateTime}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: meu pet é tímido com estranhos, prefere ser atendido no período da tarde..."
                        rows={3}
                        maxLength={1000}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Essas observações serão usadas pela IA para gerar um briefing para o prestador.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price preview */}
              {form.watch('serviceId') && (
                <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total estimado</span>
                  <span className="font-bold text-base">
                    {formatPrice(
                      activeServices.find((s) => s.id === form.watch('serviceId'))?.price ?? 0,
                    )}
                  </span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={createBooking.isPending || pets.length === 0 || activeServices.length === 0}
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando reserva...
                  </>
                ) : (
                  'Confirmar agendamento'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
