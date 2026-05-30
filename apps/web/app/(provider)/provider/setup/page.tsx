'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, CheckCircle, Upload, X, ShieldCheck, Clock, FileCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
import { useCreateService, useUpdateService, useDeleteService, type ServiceInput } from '@/lib/hooks/useServices'
import { useSetAvailability, type AvailabilitySlot } from '@/lib/hooks/useAvailability'
import { formatPrice, type ServiceType, uploadGalleryPhoto, deleteGalleryPhoto, submitVerificationDoc } from '@/lib/providers'
import { useSession } from 'next-auth/react'

// ─── constants ───────────────────────────────────────────────────────────────

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'GROOMING', label: 'Banho e Tosa' },
  { value: 'DOG_WALKING', label: 'Dog Walker' },
  { value: 'VETERINARY', label: 'Veterinário' },
  { value: 'TRAINING', label: 'Adestramento' },
  { value: 'SITTING', label: 'Hotel Pet' },
  { value: 'DAYCARE', label: 'Creche' },
  { value: 'TRANSPORT', label: 'Transporte' },
]

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ─── schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  bio: z.string().max(500).optional(),
  city: z.string().max(100).min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP'),
  zipCode: z.string().max(9).optional(),
  radiusKm: z.coerce.number().positive().max(100),
  serviceTypes: z.array(z.string()).min(1, 'Selecione ao menos um tipo de serviço'),
})

const serviceSchema = z.object({
  type: z.string().min(1, 'Selecione um tipo'),
  name: z.string().min(2, 'Nome muito curto').max(100),
  description: z.string().max(300).optional(),
  price: z.coerce.number().positive('Preço deve ser positivo'),
  durationMin: z.coerce.number().int().positive('Duração deve ser positiva'),
  homeVisit: z.boolean().default(false),
})

type ProfileValues = z.infer<typeof profileSchema>
type ServiceValues = z.infer<typeof serviceSchema>

// ─── section: profile ────────────────────────────────────────────────────────

function ProfileSection() {
  const { data: profile } = useMyProviderProfile()
  const updateProfile = useUpdateProviderProfile()

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema as any),
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

  async function onSubmit(values: ProfileValues) {
    try {
      await updateProfile.mutateAsync({
        bio: values.bio || undefined,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode || undefined,
        radiusKm: values.radiusKm,
        serviceTypes: values.serviceTypes as ServiceType[],
      })
      toast.success('Perfil salvo! Seu embedding está sendo atualizado...')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">1</span>
          Informações básicas
        </CardTitle>
        <CardDescription>
          Essas informações são usadas pela IA para recomendar você aos tutores certos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva sua experiência, especialidades e o que diferencia seu serviço..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
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
                    <FormControl><Input placeholder="SP" maxLength={2} className="uppercase" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl><Input placeholder="00000-000" maxLength={9} {...field} /></FormControl>
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
                    <FormControl><Input type="number" min={1} max={100} {...field} /></FormControl>
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
                  <FormLabel>Tipos de serviço que você oferece</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SERVICE_TYPE_OPTIONS.map((opt) => {
                      const selected = field.value?.includes(opt.value)
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const cur = field.value ?? []
                            field.onChange(
                              selected ? cur.filter((v) => v !== opt.value) : [...cur, opt.value],
                            )
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-border hover:border-primary'
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

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Salvando...' : 'Salvar informações básicas'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

// ─── section: services ───────────────────────────────────────────────────────

interface ServiceFormSheetProps {
  open: boolean
  onClose: () => void
  initial?: (ServiceValues & { id: string }) | null
}

function ServiceFormSheet({ open, onClose, initial }: ServiceFormSheetProps) {
  const createService = useCreateService()
  const updateService = useUpdateService()

  const form = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema as any),
    values: initial
      ? { type: initial.type, name: initial.name, description: initial.description ?? '', price: initial.price, durationMin: initial.durationMin, homeVisit: initial.homeVisit }
      : { type: '', name: '', description: '', price: 0, durationMin: 60, homeVisit: false },
  })

  async function onSubmit(values: ServiceValues) {
    try {
      if (initial) {
        await updateService.mutateAsync({ id: initial.id, ...values } as any)
        toast.success('Serviço atualizado!')
      } else {
        await createService.mutateAsync(values as ServiceInput)
        toast.success('Serviço adicionado!')
      }
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar serviço')
    }
  }

  const isPending = createService.isPending || updateService.isPending

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{initial ? 'Editar serviço' : 'Novo serviço'}</SheetTitle>
          <SheetDescription>Preencha os dados do serviço oferecido.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de serviço</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          field.value === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:border-primary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do serviço</FormLabel>
                  <FormControl><Input placeholder="ex: Banho + Tosa completa" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais sobre o serviço..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl><Input type="number" min={0} step={0.01} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl><Input type="number" min={15} step={15} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="homeVisit"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Atende a domicílio</FormLabel>
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Salvando...' : 'Salvar serviço'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

function ServicesSection() {
  const { data: profile } = useMyProviderProfile()
  const deleteService = useDeleteService()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<(ServiceValues & { id: string }) | null>(null)

  function openAdd() { setEditing(null); setSheetOpen(true) }
  function openEdit(svc: typeof profile extends undefined ? never : NonNullable<typeof profile>['services'][number]) {
    setEditing({ id: svc.id, type: svc.type, name: svc.name, description: svc.description ?? '', price: svc.price, durationMin: svc.durationMin, homeVisit: svc.homeVisit })
    setSheetOpen(true)
  }

  async function handleDelete(id: string) {
    try {
      await deleteService.mutateAsync(id)
      toast.success('Serviço removido')
    } catch {
      toast.error('Erro ao remover serviço')
    }
  }

  const services = profile?.services ?? []

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">2</span>
              Meus serviços
            </CardTitle>
            <CardDescription className="mt-1">Cadastre os serviços que você oferece e seus preços.</CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum serviço cadastrado ainda.{' '}
              <button onClick={openAdd} className="underline text-primary">Adicione o primeiro.</button>
            </p>
          ) : (
            <div className="divide-y">
              {services.map((svc) => (
                <div key={svc.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate">{svc.name}</p>
                      {!svc.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inativo</Badge>}
                      {svc.homeVisit && <Badge variant="secondary" className="text-xs">Domiciliar</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {SERVICE_TYPE_OPTIONS.find(o => o.value === svc.type)?.label ?? svc.type}
                      {' · '}{svc.durationMin} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-sm">{formatPrice(svc.price)}</span>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(svc)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(svc.id)} disabled={deleteService.isPending}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initial={editing}
      />
    </>
  )
}

// ─── section: availability ───────────────────────────────────────────────────

function AvailabilitySection() {
  const { data: profile } = useMyProviderProfile()
  const setAvailability = useSetAvailability()

  // Build initial state from profile
  const [slots, setSlots] = useState<Record<number, { enabled: boolean; start: string; end: string }>>(() => {
    const map: Record<number, { enabled: boolean; start: string; end: string }> = {}
    for (let d = 0; d < 7; d++) {
      const existing = profile?.availability?.find(a => a.dayOfWeek === d)
      map[d] = existing
        ? { enabled: true, start: existing.startTime, end: existing.endTime }
        : { enabled: false, start: '08:00', end: '18:00' }
    }
    return map
  })

  function toggleDay(day: number) {
    setSlots(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))
  }

  function updateTime(day: number, field: 'start' | 'end', value: string) {
    setSlots(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  async function handleSave() {
    const activeSlots: AvailabilitySlot[] = Object.entries(slots)
      .filter(([, v]) => v.enabled)
      .map(([day, v]) => ({ dayOfWeek: Number(day), startTime: v.start, endTime: v.end }))

    try {
      await setAvailability.mutateAsync(activeSlots)
      toast.success('Disponibilidade salva!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar disponibilidade')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">3</span>
          Disponibilidade semanal
        </CardTitle>
        <CardDescription>Indique os dias e horários em que você atende.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {DAYS.map((label, day) => (
          <div key={day} className="flex items-center gap-3">
            <Switch
              checked={slots[day]?.enabled ?? false}
              onCheckedChange={() => toggleDay(day)}
            />
            <span className={`w-8 text-sm font-medium ${slots[day]?.enabled ? '' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {slots[day]?.enabled && (
              <>
                <Input
                  type="time"
                  className="w-28"
                  value={slots[day].start}
                  onChange={(e) => updateTime(day, 'start', e.target.value)}
                />
                <span className="text-muted-foreground text-sm">até</span>
                <Input
                  type="time"
                  className="w-28"
                  value={slots[day].end}
                  onChange={(e) => updateTime(day, 'end', e.target.value)}
                />
              </>
            )}
          </div>
        ))}

        <div className="pt-2">
          <Button onClick={handleSave} disabled={setAvailability.isPending}>
            {setAvailability.isPending ? 'Salvando...' : 'Salvar disponibilidade'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── section: gallery ────────────────────────────────────────────────────────

function GallerySection() {
  const { data: profile, refetch } = useMyProviderProfile()
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const token = session?.user?.accessToken ?? ''

  const photos = profile?.galleryUrls ?? []

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Use JPG, PNG ou WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB')
      return
    }
    setUploading(true)
    try {
      await uploadGalleryPhoto(token, file)
      await refetch()
      toast.success('Foto adicionada!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(url: string) {
    setDeletingUrl(url)
    try {
      await deleteGalleryPhoto(token, url)
      await refetch()
      toast.success('Foto removida')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover foto')
    } finally {
      setDeletingUrl(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">4</span>
          Galeria de fotos
        </CardTitle>
        <CardDescription>
          Adicione fotos do seu espaço ou atendimentos. Máximo de 10 fotos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload zone */}
        {photos.length < 10 && (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? 'Enviando...' : 'Clique para adicionar foto (JPG, PNG, WebP — máx 5MB)'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((url) => (
              <div key={url} className="relative group rounded-lg overflow-hidden aspect-square">
                <img src={url} alt="Galeria" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleDelete(url)}
                  disabled={deletingUrl === url}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{photos.length}/10 fotos</p>
      </CardContent>
    </Card>
  )
}

// ─── section: verification ───────────────────────────────────────────────────

function VerificationSection() {
  const { data: profile, refetch } = useMyProviderProfile()
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const token = session?.user?.accessToken ?? ''

  const isPending = !!(profile?.verificationDocumentUrl && !profile.verified)
  const isVerified = profile?.verified

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Use JPG, PNG, WebP ou PDF')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB')
      return
    }
    setUploading(true)
    try {
      await submitVerificationDoc(token, file)
      await refetch()
      toast.success('Documento enviado! Analisaremos em breve.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar documento')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">5</span>
          Verificação de identidade
        </CardTitle>
        <CardDescription>
          Prestadores verificados aparecem com selo de confiança e têm destaque nas buscas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isVerified ? (
          <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Perfil verificado</p>
              <p className="text-sm">Você possui o selo de prestador verificado.</p>
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-3 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <Clock className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Em análise</p>
              <p className="text-sm">Documento enviado. A revisão leva até 2 dias úteis.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Envie um documento com foto (RG, CNH) ou diploma/certificado profissional.</p>
              <p>Formatos aceitos: JPG, PNG, WebP, PDF — máx 5MB.</p>
            </div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors max-w-sm">
              <FileCheck className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? 'Enviando...' : 'Clique para enviar documento'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ProviderSetupPage() {
  const { data: profile, isLoading } = useMyProviderProfile()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  const isComplete = !!(profile?.city && profile.services.length > 0)

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurar meu perfil</h1>
        <p className="text-muted-foreground mt-1">
          Complete as três etapas abaixo para aparecer nas buscas dos tutores.
        </p>
        {isComplete && (
          <div className="flex items-center gap-2 text-green-700 mt-3 text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Perfil configurado! Você já aparece nas buscas.
          </div>
        )}
      </div>

      <div className="space-y-6">
        <ProfileSection />
        <Separator />
        <ServicesSection />
        <Separator />
        <AvailabilitySection />
        <Separator />
        <GallerySection />
        <Separator />
        <VerificationSection />
      </div>
    </div>
  )
}
