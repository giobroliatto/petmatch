'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiRequest, apiDelete } from '@/lib/api'
import type { Pet, PetWithFullHistory, HealthRecord } from '@/lib/pets'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function useToken() {
  const { data: session } = useSession()
  return session?.user?.accessToken
}

// ─── LIST ────────────────────────────────────────────────────────────────────

export function usePets() {
  const token = useToken()
  return useQuery<Pet[]>({
    queryKey: ['pets'],
    queryFn: async () => {
      const data = await apiRequest<{ pets: Pet[] }>('/pets', { token })
      return data.pets
    },
    enabled: !!token,
  })
}

// ─── DETAIL ──────────────────────────────────────────────────────────────────

export function usePet(id: string) {
  const token = useToken()
  return useQuery<PetWithFullHistory>({
    queryKey: ['pets', id],
    queryFn: async () => {
      const data = await apiRequest<{ pet: PetWithFullHistory }>(`/pets/${id}`, { token })
      return data.pet
    },
    enabled: !!token && !!id,
  })
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export function useCreatePet() {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API}/pets`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as { message?: string })?.message ?? 'Erro ao criar pet')
      }
      return (await res.json() as { pet: Pet }).pet
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  })
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export function useUpdatePet(id: string) {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API}/pets/${id}`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as { message?: string })?.message ?? 'Erro ao atualizar pet')
      }
      return (await res.json() as { pet: Pet }).pet
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pets'] })
      qc.invalidateQueries({ queryKey: ['pets', id] })
    },
  })
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export function useDeletePet() {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/pets/${id}`, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets'] }),
  })
}

// ─── HEALTH RECORDS ──────────────────────────────────────────────────────────

export function useCreateHealthRecord(petId: string) {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      title: string
      description?: string
      date: string
      nextDueDate?: string
    }) =>
      apiRequest<{ record: HealthRecord }>(`/pets/${petId}/health-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        token,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets', petId] }),
  })
}

export function useDeleteHealthRecord(petId: string) {
  const token = useToken()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId: string) =>
      apiDelete(`/pets/${petId}/health-records/${recordId}`, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pets', petId] }),
  })
}
