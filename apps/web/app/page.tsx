import Link from 'next/link'
import { PawPrint, Search, Star, Shield, CalendarCheck, MessageSquare, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/providers'
import type { ProviderCardData } from '@/lib/providers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function fetchFeaturedProviders(): Promise<ProviderCardData[]> {
  try {
    const res = await fetch(
      `${API_URL}/providers/featured/Balne%C3%A1rio%20Cambori%C3%BA`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const data = (await res.json()) as { providers: ProviderCardData[] }
    return data.providers.slice(0, 6)
  } catch {
    return []
  }
}

export default async function Home() {
  const featured = await fetchFeaturedProviders()
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="flex items-center gap-2 mb-6">
          <PawPrint className="h-10 w-10 text-primary" />
          <span className="text-4xl font-bold tracking-tight">PetMatch BC</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl leading-tight mb-4">
          Encontre o cuidador perfeito para seu pet em Balneário Camboriú
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mb-10">
          Busca inteligente por IA — descreva as necessidades do seu animal e encontre
          prestadores verificados de banho, passeio, veterinário e muito mais.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link href="/search">
              <Search className="h-5 w-5 mr-2" />
              Buscar serviços para meu pet
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">Sou prestador de serviços</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Por que usar o PetMatch BC?</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Prestadores verificados</h3>
              <p className="text-sm text-muted-foreground">
                Todos os prestadores passam por verificação de identidade antes de aparecer nos resultados.
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
                Descreva as necessidades do seu pet em linguagem natural e nossa IA encontra o prestador ideal.
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
                Avaliações reais de tutores, chat integrado e histórico completo de cada prestador.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Como funciona</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">1</div>
              <h3 className="font-semibold">Descreva seu pet</h3>
              <p className="text-sm text-muted-foreground">Conte o que seu pet precisa em linguagem natural — a IA encontra os melhores prestadores.</p>
            </div>
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">2</div>
              <h3 className="font-semibold">Agende online</h3>
              <p className="text-sm text-muted-foreground">Escolha o prestador, selecione a data e confirme o agendamento em poucos cliques.</p>
            </div>
            <div className="space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">3</div>
              <h3 className="font-semibold">Acompanhe tudo</h3>
              <p className="text-sm text-muted-foreground">Chat direto com o prestador, notificações em tempo real e avaliação ao final.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured providers */}
      {featured.length > 0 && (
        <section className="container mx-auto max-w-5xl px-4 py-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Destaque em Balneário Camboriú</h2>
            <Button variant="ghost" asChild size="sm">
              <Link href="/search">Ver todos <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map(provider => (
              <Link key={provider.id} href={`/provider/${provider.id}`} className="group">
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-center gap-3">
                      {provider.avatarUrl ? (
                        <img src={provider.avatarUrl} alt={provider.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                          {provider.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">{provider.name}</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{provider.averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({provider.totalReviews})</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {provider.serviceTypes.slice(0, 3).map(type => (
                        <Badge key={type} variant="secondary" className="text-xs">{type}</Badge>
                      ))}
                    </div>
                    {provider.services && provider.services[0] && (
                      <p className="text-sm text-muted-foreground">
                        a partir de{' '}
                        <span className="font-semibold text-foreground">
                          {formatPrice(Math.min(...provider.services.map(s => s.price)))}
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
      {/* CTA for providers */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <CalendarCheck className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Você é prestador de serviços pet em BC?</h2>
          <p className="text-muted-foreground mb-6">
            Cadastre-se gratuitamente, complete seu perfil com verificação de identidade e comece a receber clientes.
          </p>
          <Button asChild>
            <Link href="/register">Criar conta de prestador</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">PetMatch BC</span>
            <span>— Balneário Camboriú, SC</span>
          </div>
          <div className="flex gap-4">
            <Link href="/search" className="hover:text-foreground transition-colors">Buscar</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Cadastrar</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

