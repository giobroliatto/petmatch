import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  heading?: string
  message?: string
  backHref?: string
  backLabel?: string
}

/**
 * Reusable "access denied" block.
 * Can be used as a standalone page or embedded in a layout.
 */
export function AccessDenied({
  heading = 'Acesso negado',
  message = 'Você não tem permissão para acessar esta página.',
  backHref = '/',
  backLabel = 'Voltar ao início',
}: Props) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-muted-foreground max-w-md">{message}</p>
      </div>
      <Button asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}

/** Standalone 403 page — used via Next.js notFound() or direct navigation */
export default function AccessDeniedPage() {
  return (
    <AccessDenied
      heading="Acesso negado"
      message="Você não tem permissão para acessar esta página. Se acredita que isso é um erro, entre em contato com o suporte."
    />
  )
}
