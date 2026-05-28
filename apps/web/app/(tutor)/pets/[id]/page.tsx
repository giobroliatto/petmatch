'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Trash2, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PetForm } from '@/components/pets/PetForm'
import { HealthRecordForm } from '@/components/pets/HealthRecordForm'
import { usePet, useDeletePet, useDeleteHealthRecord } from '@/lib/hooks/usePets'
import {
  SPECIES_LABELS,
  calcAge,
  healthRecordStatus,
  type HealthRecord,
} from '@/lib/pets'

const STATUS_STYLES = {
  ok: 'bg-green-100 text-green-800 border-green-300',
  soon: 'bg-amber-100 text-amber-800 border-amber-300',
  urgent: 'bg-red-100 text-red-800 border-red-300',
}

function HealthRecordRow({
  record,
  petId,
}: {
  record: HealthRecord
  petId: string
}) {
  const deleteRecord = useDeleteHealthRecord(petId)
  const status = healthRecordStatus(record.nextDueDate)

  return (
    <div className="flex items-start justify-between py-3">
      <div className="space-y-0.5">
        <p className="font-medium text-sm">{record.title}</p>
        {record.description && (
          <p className="text-xs text-muted-foreground">{record.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {new Date(record.date).toLocaleDateString('pt-BR')}
        </p>
        {record.nextDueDate && (
          <span
            className={`inline-block text-xs px-2 py-0.5 rounded border ${STATUS_STYLES[status]}`}
          >
            Próximo: {new Date(record.nextDueDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        disabled={deleteRecord.isPending}
        onClick={async () => {
          try {
            await deleteRecord.mutateAsync(record.id)
            toast.success('Registro removido')
          } catch {
            toast.error('Erro ao remover registro')
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: pet, isLoading } = usePet(id)
  const deletePet = useDeletePet()
  const [editOpen, setEditOpen] = useState(false)
  const [healthOpen, setHealthOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        <div className="h-48 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="container max-w-2xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">Pet não encontrado.</p>
        <Link href="/pets">
          <Button variant="link">Voltar</Button>
        </Link>
      </div>
    )
  }

  const sortedRecords = [...pet.healthRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  async function handleDelete() {
    if (!confirm(`Excluir ${pet!.name}? Esta ação não pode ser desfeita.`)) return
    try {
      await deletePet.mutateAsync(pet!.id)
      toast.success('Pet excluído')
      router.push('/pets')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir pet')
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      {/* Voltar */}
      <Link href="/pets" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Meus pets
      </Link>

      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
          {pet.photoUrl ? (
            <Image src={pet.photoUrl} alt={pet.name} fill className="object-cover" unoptimized />
          ) : (
            <span className="text-4xl">🐾</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{pet.name}</h1>
            {pet.neutered && (
              <Badge variant="secondary" className="text-xs">Castrado(a)</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{SPECIES_LABELS[pet.species]}{pet.breed ? ` · ${pet.breed}` : ''}</p>
          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
            <span>{calcAge(pet.birthDate)}</span>
            {pet.weightKg && <span>{pet.weightKg} kg</span>}
          </div>
          {pet.notes && <p className="text-sm mt-2 text-muted-foreground italic">{pet.notes}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          {/* Editar */}
          <Sheet open={editOpen} onOpenChange={setEditOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Editar {pet.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <PetForm pet={pet} onSuccess={() => setEditOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deletePet.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Histórico de saúde */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Histórico de saúde</h2>
          <Sheet open={healthOpen} onOpenChange={setHealthOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar registro
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Novo registro de saúde</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <HealthRecordForm petId={pet.id} onSuccess={() => setHealthOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {sortedRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum registro de saúde ainda.
          </p>
        ) : (
          <div className="divide-y">
            {sortedRecords.map((record) => (
              <HealthRecordRow key={record.id} record={record} petId={pet.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
