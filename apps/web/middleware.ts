import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Not authenticated — redirect to login
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const roles: string[] = session.user?.roles ?? []

  if (pathname.startsWith('/tutor') && !roles.includes('TUTOR')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/provider') && !roles.includes('PROVIDER')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/admin') && !roles.includes('ADMIN')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/tutor/:path*', '/provider/:path*', '/admin/:path*'],
}
