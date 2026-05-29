'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sparkles, SlidersHorizontal, Loader2, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProviderCard } from '@/components/search/ProviderCard'
import { useMatchProviders, useSearchProviders } from '@/lib/hooks/useProviders'
import { usePets } from '@/lib/hooks/usePets'
import { SERVICE_TYPE_LABELS, type ProviderCardData, type SearchFilters } from '@/lib/providers'

type Mode = 'ai' | 'filter'

const RATING_OPTIONS = [
  { label: 'Qualquer avaliação', value: '' },
  { label: '4+ estrelas', value: '4' },
  { label: '4.5+ estrelas', value: '4.5' },
  { label: '5 estrelas', value: '5' },
]

export default function SearchPage() {
  const { data: session } = useSession()
  const [mode, setMode] = useState<Mode>('ai')

  // AI mode state
  const [aiQuery, setAiQuery] = useState('')
  const [aiPetId, setAiPetId] = useState('')
  const [aiResults, setAiResults] = useState<ProviderCardData[]>([])

  // Filter mode state
  const [filters, setFilters] = useState<SearchFilters>({})
  const [filterEnabled, setFilterEnabled] = useState(false)

  const { data: pets } = usePets()
  const matchMutation = useMatchProviders()
  const { data: searchData, isFetching: isSearching } = useSearchProviders(filters, filterEnabled)

  async function handleAISearch() {
    if (!aiQuery.trim() || !aiPetId) return
    try {
      const results = await matchMutation.mutateAsync({ naturalLanguageQuery: aiQuery, petId: aiPetId })
      setAiResults(results)
    } catch {
      // Silently fall back to empty results
      setAiResults([])
    }
  }

  function handleFilterSearch() {
    setFilterEnabled(true)
  }

  const filterResults = searchData?.providers ?? []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Encontrar prestadores</h1>
          <p className="text-muted-foreground">
            Use a busca com IA para encontrar o prestador perfeito, ou filtre manualmente.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'ai' ? 'default' : 'outline'}
            onClick={() => setMode('ai')}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Busca com IA
          </Button>
          <Button
            variant={mode === 'filter' ? 'default' : 'outline'}
            onClick={() => setMode('filter')}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* AI Mode */}
        {mode === 'ai' && (
          <div className="bg-card rounded-xl border p-6 mb-8 space-y-4">
            {!session ? (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Faça login para usar a busca com IA.</p>
                <Button variant="link" asChild>
                  <a href="/login">Entrar</a>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Descreva o que você precisa para seu pet</Label>
                  <Textarea
                    placeholder="Ex: Preciso de um passeador paciente para minha cachorra ansiosa que não gosta de outros cães..."
                    rows={3}
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Selecione o pet</Label>
                  <Select value={aiPetId} onValueChange={setAiPetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um pet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(pets ?? []).map(pet => (
                        <SelectItem key={pet.id} value={pet.id}>
                          {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAISearch}
                  disabled={!aiQuery.trim() || !aiPetId || matchMutation.isPending}
                  className="w-full gap-2"
                >
                  {matchMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analisando o perfil do seu pet...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Buscar com IA
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Filter Mode */}
        {mode === 'filter' && (
          <div className="bg-card rounded-xl border p-6 mb-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  placeholder="Ex: São Paulo"
                  value={filters.city ?? ''}
                  onChange={e => {
                    setFilterEnabled(false)
                    setFilters(f => ({ ...f, city: e.target.value || undefined }))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de serviço</Label>
                <Select
                  value={filters.serviceType ?? ''}
                  onValueChange={v => {
                    setFilterEnabled(false)
                    setFilters(f => ({ ...f, serviceType: v || undefined }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os serviços" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os serviços</SelectItem>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Avaliação mínima</Label>
                <Select
                  value={filters.minRating !== undefined ? String(filters.minRating) : ''}
                  onValueChange={v => {
                    setFilterEnabled(false)
                    setFilters(f => ({ ...f, minRating: v ? Number(v) : undefined }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer avaliação" />
                  </SelectTrigger>
                  <SelectContent>
                    {RATING_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Preço máximo (R$)</Label>
                <Input
                  type="number"
                  placeholder="Sem limite"
                  min={0}
                  value={filters.maxPrice ?? ''}
                  onChange={e => {
                    setFilterEnabled(false)
                    setFilters(f => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="homeVisit"
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={filters.homeVisit ?? false}
                onChange={e => {
                  setFilterEnabled(false)
                  setFilters(f => ({ ...f, homeVisit: e.target.checked || undefined }))
                }}
              />
              <Label htmlFor="homeVisit">Atende a domicílio</Label>
            </div>

            <Button onClick={handleFilterSearch} disabled={isSearching} className="w-full gap-2">
              {isSearching ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</>
              ) : (
                'Buscar'
              )}
            </Button>
          </div>
        )}

        {/* Results */}
        {mode === 'ai' && aiResults.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">
                {aiResults.length} prestador{aiResults.length !== 1 ? 'es' : ''} encontrado
                {aiResults.length !== 1 ? 's' : ''} pela IA
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aiResults.map(provider => (
                <ProviderCard key={provider.id} provider={provider} aiMode />
              ))}
            </div>
          </>
        )}

        {mode === 'filter' && filterEnabled && (
          <>
            {filterResults.length > 0 ? (
              <>
                <div className="mb-4">
                  <h2 className="font-semibold">
                    {searchData?.total ?? 0} prestador{(searchData?.total ?? 0) !== 1 ? 'es' : ''} encontrado
                    {(searchData?.total ?? 0) !== 1 ? 's' : ''}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filterResults.map(provider => (
                    <ProviderCard key={provider.id} provider={provider} />
                  ))}
                </div>
              </>
            ) : !isSearching ? (
              <div className="text-center py-16 text-muted-foreground">
                <SearchX className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum prestador encontrado</p>
                <p className="text-sm mt-1">Tente ajustar os filtros.</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
