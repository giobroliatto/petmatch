'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { SPECIES_LABELS, type Pet } from '@/lib/pets'
import { useCreatePet, useUpdatePet } from '@/lib/hooks/usePets'

const petSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  species: z.enum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'OTHER']),
  breed: z.string().optional(),
  birthDate: z.string().optional(),
  weightKg: z.string().optional(),
  neutered: z.boolean(),
  notes: z.string().optional(),
})

type PetFormValues = z.infer<typeof petSchema>

interface PetFormProps {
  pet?: Pet
  onSuccess?: () => void
}

export function PetForm({ pet, onSuccess }: PetFormProps) {
  const isEdit = !!pet
  const createPet = useCreatePet()
  const updatePet = useUpdatePet(pet?.id ?? '')

  const [photoPreview, setPhotoPreview] = useState<string | null>(pet?.photoUrl ?? null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: pet?.name ?? '',
      species: pet?.species ?? 'DOG',
      breed: pet?.breed ?? '',
      birthDate: pet?.birthDate ? pet.birthDate.slice(0, 10) : '',
      weightKg: pet?.weightKg?.toString() ?? '',
      neutered: pet?.neutered ?? false,
      notes: pet?.notes ?? '',
    },
  })

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function onSubmit(values: PetFormValues) {
    const fd = new FormData()
    fd.append('name', values.name)
    fd.append('species', values.species)
    if (values.breed) fd.append('breed', values.breed)
    if (values.birthDate) fd.append('birthDate', values.birthDate)
    if (values.weightKg) fd.append('weightKg', values.weightKg)
    fd.append('neutered', String(values.neutered))
    if (values.notes) fd.append('notes', values.notes)
    if (photoFile) fd.append('photo', photoFile)

    try {
      if (isEdit) {
        await updatePet.mutateAsync(fd)
        toast.success('Pet atualizado!')
      } else {
        await createPet.mutateAsync(fd)
        toast.success('Pet cadastrado!')
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar pet')
    }
  }

  const loading = createPet.isPending || updatePet.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Foto */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Foto</p>
          <div className="flex items-center gap-4">
            {photoPreview ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-full border">
                <Image src={photoPreview} alt="Preview" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border bg-muted text-2xl">
                🐾
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Nome */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do pet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Espécie */}
        <FormField
          control={form.control}
          name="species"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Espécie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.entries(SPECIES_LABELS) as [string, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Raça */}
        <FormField
          control={form.control}
          name="breed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Raça (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Golden Retriever" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Data de nascimento */}
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Peso */}
          <FormField
            control={form.control}
            name="weightKg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="Ex: 5.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Castrado */}
        <FormField
          control={form.control}
          name="neutered"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel className="mb-0">Castrado(a)</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Observações */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Alergias, temperamento, cuidados especiais…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar pet'}
        </Button>
      </form>
    </Form>
  )
}
