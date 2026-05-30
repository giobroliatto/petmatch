import Link from 'next/link'
import { PawPrint, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <PawPrint className="h-10 w-10" />
        <SearchX className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-muted-foreground/40">404</h1>
        <h2 className="text-2xl font-semibold">Página não encontrada</h2>
        <p className="text-muted-foreground max-w-md">
          A página que você está procurando não existe ou foi removida.
          Verifique o endereço digitado ou volte à página inicial.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">Buscar prestadores</Link>
        </Button>
      </div>
    </div>
  )
}
