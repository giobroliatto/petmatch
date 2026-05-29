'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export interface AvailabilitySlot {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export function useSetAvailability() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (slots: AvailabilitySlot[]) => {
      const res = await fetch(`${API_URL}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.accessToken ?? ''}`,
        },
        body: JSON.stringify({ slots }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Erro ao salvar disponibilidade')
      }
      return res.json() as Promise<{ availability: AvailabilitySlot[] }>
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['providers', 'me'] }),
  })
}
