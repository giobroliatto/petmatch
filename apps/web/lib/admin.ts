const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function adminFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const data = (await res.json()) as { error?: string }
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export interface PlatformStats {
  totalUsers: number
  totalProviders: number
  totalBookings: number
  bookingsByStatus: Record<string, number>
  bookingsThisMonth: number
  pendingVerifications: number
}

export interface PendingVerification {
  id: string
  verificationDocumentUrl: string
  verificationSubmittedAt: string
  user: { id: string; name: string; email: string }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  roles: string[]
  suspended: boolean
  createdAt: string
  avatarUrl?: string | null
}

export function getStats(token: string) {
  return adminFetch<PlatformStats>('/admin/stats', token)
}

export function getPendingVerifications(token: string) {
  return adminFetch<{ verifications: PendingVerification[] }>('/admin/verifications', token)
}

export function approveVerification(token: string, providerId: string) {
  return adminFetch<{ ok: boolean }>(`/admin/verifications/${providerId}/approve`, token, { method: 'POST' })
}

export function rejectVerification(token: string, providerId: string, reason: string) {
  return adminFetch<{ ok: boolean }>(`/admin/verifications/${providerId}/reject`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function listUsers(token: string, page: number, search?: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' })
  if (search) params.set('search', search)
  return adminFetch<{ users: AdminUser[]; total: number; page: number }>(`/admin/users?${params}`, token)
}

export function suspendUser(token: string, userId: string, reason: string) {
  return adminFetch<{ ok: boolean }>(`/admin/users/${userId}/suspend`, token, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}
