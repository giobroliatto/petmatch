'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, PawPrint, Calendar, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TutorDashboardPage() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Tutor'

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Olá, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">O que você precisa hoje para o seu pet?</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5 text-primary" />
              Buscar serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Encontre prestadores verificados na sua região usando busca por IA ou filtros.
            </p>
            <Button asChild className="w-full">
              <Link href="/search">
                Buscar agora <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PawPrint className="h-5 w-5 text-primary" />
              Meus pets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Gerencie o cadastro, fichas de saúde e fotos dos seus pets.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/tutor/pets">
                Ver pets <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow sm:col-span-2 opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Minhas reservas
              <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Em breve</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acompanhe suas reservas e histórico de serviços contratados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
