'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCreateHealthRecord } from '@/lib/hooks/usePets'

const healthSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  nextDueDate: z.string().optional(),
})

type HealthFormValues = z.infer<typeof healthSchema>

interface HealthRecordFormProps {
  petId: string
  onSuccess?: () => void
}

export function HealthRecordForm({ petId, onSuccess }: HealthRecordFormProps) {
  const createRecord = useCreateHealthRecord(petId)

  const form = useForm<HealthFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(healthSchema as any),
    defaultValues: { title: '', description: '', date: '', nextDueDate: '' },
  })

  async function onSubmit(values: HealthFormValues) {
    try {
      await createRecord.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        date: values.date,
        nextDueDate: values.nextDueDate || undefined,
      })
      toast.success('Registro adicionado!')
      form.reset()
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar registro')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Vacina antirrábica, Consulta, Vermífugo…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (opcional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Detalhes do registro…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nextDueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Próxima dose / retorno</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={createRecord.isPending}>
          {createRecord.isPending ? 'Salvando…' : 'Adicionar registro'}
        </Button>
      </form>
    </Form>
  )
}
