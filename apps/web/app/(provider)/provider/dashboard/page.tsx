'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Star, MapPin, CheckCircle, ChevronRight, Package, Pencil, Calendar, Sparkles, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { stripMarkdown } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useMyProviderProfile, useUpdateProviderProfile } from '@/lib/hooks/useProviders'
import { useBookings, useConfirmBooking, useRejectBooking } from '@/lib/hooks/useBookings'
import { formatPrice, SERVICE_TYPE_LABELS, DAYS_OF_WEEK, type ServiceType } from '@/lib/providers'
import { DeniedToast } from '@/components/ui/denied-toast'

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'GROOMING', label: 'Banho & Tosa' },
  { value: 'DOG_WALKING', label: 'Passeio' },
  { value: 'VETERINARY', label: 'Veterinário' },
  { value: 'TRAINING', label: 'Adestramento' },
  { value: 'SITTING', label: 'Pet Sitting' },
  { value: 'DAYCARE', label: 'Creche' },
  { value: 'TRANSPORT', label: 'Transporte' },
]

const editSchema = z.object({
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(9).optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  serviceTypes: z.array(z.string()).optional(),
})
type EditFormInput = z.input<typeof editSchema>
type EditFormValues = z.output<typeof editSchema>

export default function ProviderDashboardPage() {
  const { data: session } = useSession()
  const { data: profile, isLoading, error } = useMyProviderProfile()
  const updateProfile = useUpdateProviderProfile()
  const { data: pendingBookings = [] } = useBookings('PENDING')
  const { data: confirmedBookings = [] } = useBookings('CONFIRMED')
  const confirmBooking = useConfirmBooking()
  const rejectBooking = useRejectBooking()
  const [editOpen, setEditOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const todayBookings = confirmedBookings.filter((b) =>
    isToday(new Date(b.scheduledAt)),
  )

  const form = useForm<EditFormInput, unknown, EditFormValues>({
    resolver: zodResolver(editSchema),
    values: profile
      ? {
          bio: profile.bio ?? '',
          city: profile.city ?? '',
          state: profile.state ?? '',
          zipCode: '',
          radiusKm: profile.radiusKm,
          serviceTypes: profile.serviceTypes,
        }
      : undefined,
  })

  async function onSubmitEdit(values: EditFormValues) {
    try {
      await updateProfile.mutateAsync({
        bio: values.bio || undefined,
        city: values.city || undefined,
        state: values.state || undefined,
        zipCode: values.zipCode || undefined,
        radiusKm: values.radiusKm,
        serviceTypes: values.serviceTypes as ServiceType[],
      })
      toast.success('Perfil atualizado! Embedding sendo regenerado...')
      setEditOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
    }
  }

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
      <DeniedToast />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Olá, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Aqui está um resumo do seu perfil</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Editar bio
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/provider/${profile.id}`}>Ver perfil público</Link>
          </Button>
          <Button asChild>
            <Link href="/provider/setup">Gerenciar serviços</Link>
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

      {/* Pending booking requests */}
      {pendingBookings.length > 0 && (
        <Card className="mb-6 border-yellow-200 dark:border-yellow-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-600" />
              Solicitações pendentes ({pendingBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{booking.service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Tutor: {booking.tutor.user.name} · Pet: {booking.pet.name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(booking.scheduledAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                        {' · '}
                        <span className="font-medium">{formatPrice(booking.totalPrice)}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await confirmBooking.mutateAsync(booking.id)
                            toast.success('Reserva confirmada!')
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Erro')
                          }
                        }}
                        disabled={confirmBooking.isPending && rejectingId !== booking.id}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          setRejectingId(booking.id)
                          try {
                            await rejectBooking.mutateAsync({ id: booking.id })
                            toast.success('Reserva recusada.')
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : 'Erro')
                          } finally {
                            setRejectingId(null)
                          }
                        }}
                        disabled={rejectingId === booking.id && rejectBooking.isPending}
                      >
                        Recusar
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/provider/bookings/${booking.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {booking.briefing && (
                    <div className="bg-primary/5 rounded-md px-3 py-2 border border-primary/20">
                      <p className="text-xs font-medium flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Briefing IA
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {booking.briefing ? stripMarkdown(booking.briefing) : ''}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's schedule */}
      {todayBookings.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Agenda de hoje ({todayBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {todayBookings
                .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                .map((booking) => (
                  <div key={booking.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{booking.service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.tutor.user.name} · {booking.pet.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {format(new Date(booking.scheduledAt), 'HH:mm', { locale: ptBR })}
                      </span>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/provider/bookings/${booking.id}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <Link href="/provider/setup">
                  Gerenciar <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activeServices.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Nenhum serviço ativo.{' '}
                  <Link href="/provider/setup" className="underline">
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

      {/* Edit profile sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Editar perfil</SheetTitle>
            <SheetDescription>
              Preencha suas informações para aparecer na busca por IA.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva sua experiência, especialidades e diferencias..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input placeholder="SP" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" maxLength={9} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="radiusKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raio de atendimento (km)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={100} {...field} value={(field.value as number | undefined) ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="serviceTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipos de serviço</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SERVICE_TYPE_OPTIONS.map((opt) => {
                        const selected = field.value?.includes(opt.value)
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const current = field.value ?? []
                              field.onChange(
                                selected
                                  ? current.filter((v) => v !== opt.value)
                                  : [...current, opt.value],
                              )
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-foreground border-border hover:border-primary'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="flex-1"
                >
                  {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

