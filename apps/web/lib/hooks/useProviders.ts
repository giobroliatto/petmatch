'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import type {
  SearchFilters,
  SearchProvidersResponse,
  MatchProvidersResponse,
  ProviderFullProfile,
  MyProviderDashboard,
  UpdateProviderProfileInput,
} from '../providers'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export function useSearchProviders(filters: SearchFilters, enabled: boolean) {
  return useQuery({
    queryKey: ['providers', 'search', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.city) params.set('city', filters.city)
      if (filters.serviceType) params.set('serviceType', filters.serviceType)
      if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating))
      if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
      if (filters.homeVisit) params.set('homeVisit', 'true')
      params.set('page', String(filters.page ?? 1))

      const res = await fetch(`${API_URL}/providers/search?${params}`)
      if (!res.ok) throw new Error('Falha na busca')
      return res.json() as Promise<SearchProvidersResponse>
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMatchProviders() {
  const { data: session } = useSession()

  return useMutation({
    mutationFn: async (input: {
      naturalLanguageQuery: string
      petId: string
      serviceType?: string
      city?: string
      maxDistanceKm?: number
    }) => {
      const res = await fetch(`${API_URL}/providers/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.accessToken ?? ''}`,
        },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Falha no matching')
      }
      const data = (await res.json()) as MatchProvidersResponse
      return data.results
    },
  })
}

export function useProviderProfile(providerId: string) {
  return useQuery({
    queryKey: ['providers', providerId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/providers/${providerId}`)
      if (!res.ok) throw new Error('Prestador não encontrado')
      const data = (await res.json()) as { provider: ProviderFullProfile }
      return data.provider
    },
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMyProviderProfile() {
  const { data: session, status } = useSession()
  return useQuery({
    queryKey: ['providers', 'me'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/providers/me`, {
        headers: {
          Authorization: `Bearer ${session!.user!.accessToken}`,
        },
      })
      if (!res.ok) throw new Error('Perfil não encontrado')
      const data = (await res.json()) as { provider: MyProviderDashboard }
      return data.provider
    },
    enabled: status === 'authenticated' && !!session?.user?.accessToken,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProviderProfile() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProviderProfileInput) => {
      const res = await fetch(`${API_URL}/providers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.accessToken ?? ''}`,
        },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Falha ao atualizar perfil')
      }
      return res.json() as Promise<{ provider: MyProviderDashboard }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers', 'me'] })
    },
  })
}
