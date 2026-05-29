'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getMessages, sendMessage, getUnreadCount } from '../bookings'

export function useMessages(bookingId: string, enabled = true) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  return useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () => getMessages(token!, bookingId),
    enabled: !!token && !!bookingId && enabled,
    staleTime: 0,
    refetchInterval: false, // Polling is handled manually in BookingChat
  })
}

export function useSendMessage(bookingId: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => sendMessage(session!.user.accessToken, bookingId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', bookingId] })
    },
  })
}

export function useUnreadCount() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  return useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => getUnreadCount(token!),
    enabled: !!token,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // Refresh every minute
  })
}
