import Link from 'next/link'
import { PawPrint, Search, Star, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="flex items-center gap-2 mb-6">
          <PawPrint className="h-10 w-10 text-primary" />
          <span className="text-4xl font-bold tracking-tight">PetMatch</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl leading-tight mb-4">
          Conecte seu pet aos melhores cuidadores
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mb-10">
          Encontre prestadores verificados para banho, passeio, veterinário e muito mais —
          com busca inteligente por IA que entende as necessidades do seu animal.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link href="/search">
              <Search className="h-5 w-5 mr-2" />
              Buscar serviços para meu pet
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">
              Seja um prestador de serviços
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Por que usar o PetMatch?</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Prestadores verificados</h3>
              <p className="text-sm text-muted-foreground">
                Todos os prestadores passam por verificação antes de aparecer nos resultados.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Busca por IA</h3>
              <p className="text-sm text-muted-foreground">
                Descreva as necessidades do seu pet em linguagem natural e encontre o prestador ideal.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Segurança garantida</h3>
              <p className="text-sm text-muted-foreground">
                Avaliações reais de tutores e histórico completo de cada prestador.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA for providers */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Você é prestador de serviços pet?</h2>
          <p className="text-muted-foreground mb-6">
            Cadastre-se gratuitamente, complete seu perfil e comece a receber clientes pela plataforma.
          </p>
          <Button asChild>
            <Link href="/register">Criar conta de prestador</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

