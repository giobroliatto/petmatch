import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Validates that a callbackUrl is a safe relative path within this app.
 * Prevents open redirect attacks.
 */
function isSafeCallbackUrl(url: string | null): url is string {
  if (!url) return false
  // Must be a relative path starting with / but not //
  return url.startsWith('/') && !url.startsWith('//')
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const roles: string[] = session?.user?.roles ?? []

  // ── Logged-in user visiting auth pages → redirect to their dashboard ──────
  if (session && (pathname === '/login' || pathname === '/register')) {
    const dest = roles.includes('PROVIDER')
      ? '/provider/dashboard'
      : roles.includes('TUTOR')
        ? '/tutor/dashboard'
        : roles.includes('ADMIN')
          ? '/admin'
          : '/'
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // ── Auth pages are always accessible to unauthenticated users ────────────
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }

  // ── Not authenticated → redirect to /login with safe callbackUrl ──────────
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    if (isSafeCallbackUrl(pathname)) {
      loginUrl.searchParams.set('callbackUrl', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // ── Wrong role → redirect to own dashboard with denied flag ──────────────
  if (pathname.startsWith('/tutor') && !roles.includes('TUTOR') && !roles.includes('ADMIN')) {
    const dest = roles.includes('PROVIDER') ? '/provider/dashboard' : '/'
    const url = new URL(dest, req.url)
    url.searchParams.set('denied', '1')
    return NextResponse.redirect(url)
  }

  if (
    (pathname.startsWith('/provider/dashboard') ||
      pathname.startsWith('/provider/setup') ||
      pathname.startsWith('/provider/bookings')) &&
    !roles.includes('PROVIDER') &&
    !roles.includes('ADMIN')
  ) {
    const dest = roles.includes('TUTOR') ? '/tutor/dashboard' : '/'
    const url = new URL(dest, req.url)
    url.searchParams.set('denied', '1')
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/admin') && !roles.includes('ADMIN')) {
    const dest = roles.includes('PROVIDER')
      ? '/provider/dashboard'
      : roles.includes('TUTOR')
        ? '/tutor/dashboard'
        : '/'
    const url = new URL(dest, req.url)
    url.searchParams.set('denied', '1')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Auth pages (to redirect logged-in users away)
    '/login',
    '/register',
    // Protected areas
    '/tutor/:path*',
    '/provider/dashboard',
    '/provider/dashboard/:path*',
    '/provider/setup',
    '/provider/setup/:path*',
    '/provider/bookings',
    '/provider/bookings/:path*',
    '/admin/:path*',
  ],
}
