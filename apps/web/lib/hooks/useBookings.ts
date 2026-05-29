'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import {
  listMyBookings,
  getBooking,
  createBooking,
  confirmBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
  createReview,
  type BookingStatus,
  type CreateBookingInput,
} from '../bookings'

export function useBookings(status?: BookingStatus) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  return useQuery({
    queryKey: ['bookings', status ?? 'all'],
    queryFn: () => listMyBookings(token!, status),
    enabled: !!token,
    staleTime: 1000 * 30,
  })
}

export function useBooking(id: string) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken

  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => getBooking(token!, id),
    enabled: !!token && !!id,
    staleTime: 1000 * 15,
  })
}

export function useCreateBooking() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBookingInput) => createBooking(session!.user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

export function useConfirmBooking() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => confirmBooking(session!.user.accessToken, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', id] })
    },
  })
}

export function useRejectBooking() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectBooking(session!.user.accessToken, id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', id] })
    },
  })
}

export function useCompleteBooking() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => completeBooking(session!.user.accessToken, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', id] })
    },
  })
}

export function useCancelBooking() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelBooking(session!.user.accessToken, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', id] })
    },
  })
}

export function useCreateReview() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { bookingId: string; rating: number; comment?: string }) =>
      createReview(session!.user.accessToken, data),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', bookingId] })
    },
  })
}
