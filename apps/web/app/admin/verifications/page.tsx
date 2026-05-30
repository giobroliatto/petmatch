'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle, XCircle, FileText, Loader2, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  type PendingVerification,
} from '@/lib/admin'

export default function AdminVerificationsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<PendingVerification | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const token = session?.user?.accessToken ?? ''

  async function load() {
    if (!token) return
    try {
      const data = await getPendingVerifications(token)
      setItems(data.verifications)
    } catch {
      toast.error('Erro ao carregar verificações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token]) // eslint-disable-line

  async function handleApprove(item: PendingVerification) {
    setProcessing(item.id)
    try {
      await approveVerification(token, item.id)
      toast.success(`${item.user.name} verificado com sucesso!`)
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar')
    } finally {
      setProcessing(null)
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget || !rejectReason.trim()) return
    setProcessing(rejectTarget.id)
    try {
      await rejectVerification(token, rejectTarget.id, rejectReason.trim())
      toast.success('Verificação rejeitada.')
      setItems(prev => prev.filter(i => i.id !== rejectTarget.id))
      setRejectTarget(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao rejeitar')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Fila de verificações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Revise os documentos enviados pelos prestadores
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma verificação pendente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">{item.user.name}</p>
                    <p className="text-sm text-muted-foreground">{item.user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviado em{' '}
                      {format(new Date(item.verificationSubmittedAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={item.verificationDocumentUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-1" />
                        Ver documento
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item)}
                      disabled={processing === item.id}
                    >
                      {processing === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setRejectTarget(item)}
                      disabled={processing === item.id}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar verificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Prestador: <strong>{rejectTarget?.user.name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Motivo da rejeição</Label>
              <Textarea
                id="reason"
                placeholder="Ex: documento ilegível, foto cortada..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || !!processing}
              onClick={handleRejectConfirm}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
