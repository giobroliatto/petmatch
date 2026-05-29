'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Menu, X, PawPrint, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

interface NavLink {
  href: string
  label: string
}

function getTutorLinks(): NavLink[] {
  return [
    { href: '/search', label: 'Buscar serviços' },
    { href: '/tutor/pets', label: 'Meus pets' },
    { href: '/tutor/dashboard', label: 'Painel' },
  ]
}

function getProviderLinks(): NavLink[] {
  return [
    { href: '/provider/dashboard', label: 'Painel' },
    { href: '/provider/setup', label: 'Meus serviços' },
  ]
}

function getPublicLinks(): NavLink[] {
  return [
    { href: '/search', label: 'Buscar' },
  ]
}

function NavLinks({ links, onClick }: { links: NavLink[]; onClick?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          className={`text-sm font-medium transition-colors hover:text-primary ${
            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}

export function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Hide header on auth pages
  if (AUTH_ROUTES.some((r) => pathname?.startsWith(r))) return null

  const roles: string[] = (session?.user as { roles?: string[] })?.roles ?? []
  const isProvider = roles.includes('PROVIDER')
  const isTutor = roles.includes('TUTOR')
  const isAdmin = roles.includes('ADMIN')
  const isAuthenticated = status === 'authenticated'

  const navLinks = isProvider
    ? getProviderLinks()
    : isTutor || isAdmin
      ? getTutorLinks()
      : getPublicLinks()

  const adminLink: NavLink = { href: '/admin', label: 'Admin' }

  async function handleLogout() {
    setMobileOpen(false)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80">
          <PawPrint className="h-5 w-5 text-primary" />
          PetMatch
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks links={navLinks} />
          {isAdmin && (
            <Link
              href={adminLink.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {adminLink.label}
            </Link>
          )}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground truncate max-w-[140px]">
                {session.user?.name?.split(' ')[0]}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Criar conta</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile menu sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5 text-primary" />
              PetMatch
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-4 mt-6">
            <NavLinks links={navLinks} onClick={() => setMobileOpen(false)} />
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Admin
              </Link>
            )}

            <Separator />

            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  {session.user?.name}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/register">Criar conta</Link>
                </Button>
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
