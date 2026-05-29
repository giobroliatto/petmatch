'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface ServiceInput {
  type: string
  name: string
  description?: string
  price: number
  durationMin: number
  homeVisit: boolean
}

export interface ServiceUpdateInput extends Partial<ServiceInput> {
  active?: boolean
}

async function authFetch(
  url: string,
  method: string,
  body: unknown,
  token: string,
  expectBody = true,
) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = expectBody ? ((await res.json()) as { error?: string }) : {}
    throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export function useCreateService() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ServiceInput) =>
      authFetch(`${API_URL}/services`, 'POST', input, session?.user?.accessToken ?? ''),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['providers', 'me'] }),
  })
}

export function useUpdateService() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: ServiceUpdateInput & { id: string }) =>
      authFetch(`${API_URL}/services/${id}`, 'PATCH', data, session?.user?.accessToken ?? ''),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['providers', 'me'] }),
  })
}

export function useDeleteService() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      authFetch(`${API_URL}/services/${id}`, 'DELETE', undefined, session?.user?.accessToken ?? '', false),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['providers', 'me'] }),
  })
}
