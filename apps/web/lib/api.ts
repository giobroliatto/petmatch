const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message =
      (data as { message?: string })?.message ??
      Object.values((data as { errors?: Record<string, string[]> })?.errors ?? {})
        .flat()
        .join(', ') ??
      `Erro ${res.status}`
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  })
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    token,
  })
}

export async function apiDelete(path: string, token?: string): Promise<void> {
  return apiRequest<void>(path, { method: 'DELETE', token })
}
