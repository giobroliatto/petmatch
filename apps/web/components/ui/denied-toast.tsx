'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Suspense } from 'react'

function DeniedToastInner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('denied')) {
      toast.error('Você não tem permissão para acessar essa página.')
      // Clean the URL so the toast doesn't reappear on refresh
      const url = new URL(window.location.href)
      url.searchParams.delete('denied')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  return null
}

/**
 * Shows a toast when the URL contains ?denied=1 (set by the auth middleware).
 * Must be wrapped in Suspense so useSearchParams works correctly with Next.js App Router.
 */
export function DeniedToast() {
  return (
    <Suspense>
      <DeniedToastInner />
    </Suspense>
  )
}
