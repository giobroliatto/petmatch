'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, UserX, Loader2, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { listUsers, suspendUser, type AdminUser } from '@/lib/admin'

const ROLE_LABELS: Record<string, string> = {
  TUTOR: 'Tutor',
  PROVIDER: 'Prestador',
  ADMIN: 'Admin',
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null)
  const [suspendReason, setSuspendReason] = useState('')

  const token = session?.user?.accessToken ?? ''

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await listUsers(token, page, search || undefined)
      setUsers(data.users)
      setTotal(data.total)
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [token, page, search])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function handleSuspendConfirm() {
    if (!suspendTarget || !suspendReason.trim()) return
    setProcessing(suspendTarget.id)
    try {
      await suspendUser(token, suspendTarget.id, suspendReason.trim())
      toast.success(`${suspendTarget.name} suspenso.`)
      setUsers(prev => prev.map(u => u.id === suspendTarget.id ? { ...u, suspended: true } : u))
      setSuspendTarget(null)
      setSuspendReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao suspender')
    } finally {
      setProcessing(null)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gerenciar usuários</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} usuários cadastrados</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{user.name}</p>
                      {user.suspended && (
                        <Badge variant="destructive" className="text-xs">Suspenso</Badge>
                      )}
                      {user.roles.map(r => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {ROLE_LABELS[r] ?? r}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cadastrado em{' '}
                      {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  {!user.suspended && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setSuspendTarget(user)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Suspender
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Suspend dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={(open) => !open && setSuspendTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspender usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Usuário: <strong>{suspendTarget?.name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="suspend-reason">Motivo da suspensão</Label>
              <Textarea
                id="suspend-reason"
                placeholder="Ex: violação dos termos de uso..."
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                rows={3}
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!suspendReason.trim() || !!processing}
              onClick={handleSuspendConfirm}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar suspensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
