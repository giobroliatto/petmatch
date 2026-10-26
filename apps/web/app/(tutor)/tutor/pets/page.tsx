'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PlusCircle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { PetForm } from '@/components/pets/PetForm'
import { usePets } from '@/lib/hooks/usePets'
import { SPECIES_LABELS, calcAge, type Pet } from '@/lib/pets'

function PetCard({ pet }: { pet: Pet }) {
  const [now] = useState(() => Date.now())
  const hasReminder = pet.healthRecords.some((r) => {
    if (!r.nextDueDate) return false
    const due = new Date(r.nextDueDate)
    const diff = Math.ceil((due.getTime() - now) / (1000 * 60 * 60 * 24))
    return diff <= 7
  })

  return (
    <Link href={`/tutor/pets/${pet.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
          <div className="relative h-20 w-20 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
            {pet.photoUrl ? (
              <Image src={pet.photoUrl} alt={pet.name} fill className="object-cover" unoptimized />
            ) : (
              <span className="text-3xl">🐾</span>
            )}
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <p className="font-semibold">{pet.name}</p>
              {hasReminder && (
                <Bell className="h-4 w-4 text-amber-500" aria-label="Lembrete próximo" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{SPECIES_LABELS[pet.species]}</p>
            <p className="text-xs text-muted-foreground">{calcAge(pet.birthDate)}</p>
          </div>
          {hasReminder && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
              Lembrete em breve
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function PetsPage() {
  const { data: pets, isLoading, error } = usePets()
  const [open, setOpen] = useState(false)

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Pets</h1>
          <p className="text-muted-foreground text-sm">Gerencie os perfis dos seus pets</p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar pet
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Novo pet</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <PetForm onSuccess={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-destructive text-sm">Erro ao carregar pets. Tente novamente.</p>
      )}

      {pets && pets.length === 0 && (
        <div className="text-center py-20 text-muted-foreground space-y-2">
          <p className="text-4xl">🐾</p>
          <p className="font-medium">Nenhum pet cadastrado ainda</p>
          <p className="text-sm">Clique em &quot;Adicionar pet&quot; para começar</p>
        </div>
      )}

      {pets && pets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  )
}
