'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMessages, useSendMessage } from '@/lib/hooks/useMessages'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BookingChatProps {
  bookingId: string
  currentUserId: string
  disabled?: boolean
}

export function BookingChat({ bookingId, currentUserId, disabled = false }: BookingChatProps) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { data: messages = [], isLoading } = useMessages(bookingId)
  const sendMessage = useSendMessage(bookingId)
  const [content, setContent] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Poll every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user?.accessToken) {
        queryClient.invalidateQueries({ queryKey: ['messages', bookingId] })
      }
    }, 15_000)
    return () => clearInterval(interval)
  }, [bookingId, queryClient, session])

  // Auto-scroll to bottom within the chat container (not the page)
  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    try {
      await sendMessage.mutateAsync(trimmed)
      setContent('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Carregando mensagens...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[420px]">
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-3 p-4 bg-muted/30 rounded-t-lg"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Nenhuma mensagem ainda. Inicie a conversa!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}
              >
                {!isMine && (
                  <span className="text-xs text-muted-foreground px-1">{msg.sender.name}</span>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-background border rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[11px] text-muted-foreground px-1">
                  {format(new Date(msg.createdAt), "HH:mm 'de' dd/MM", { locale: ptBR })}
                  {isMine && msg.readAt && (
                    <span className="ml-1 text-primary">✓✓</span>
                  )}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-3 border rounded-b-lg bg-background"
      >
        <Input
          placeholder={disabled ? 'Chat encerrado' : 'Digite uma mensagem...'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={disabled || sendMessage.isPending}
          className="flex-1"
          maxLength={2000}
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled || !content.trim() || sendMessage.isPending}
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
