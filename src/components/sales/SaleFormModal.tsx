import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { salesService } from '@/services/salesService'
import { crmService } from '@/services/crmService'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Client } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { parseISO, format } from 'date-fns'

const saleSchema = z.object({
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  car: z.string().min(1, 'Veículo é obrigatório'),
  value: z.coerce.number().min(0.01, 'Valor deve ser maior que 0'),
  commission: z.coerce.number().min(0, 'Comissão não pode ser negativa'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  status: z.enum(['pending', 'paid']).default('pending'),
})

type SaleFormValues = z.infer<typeof saleSchema>

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId?: string | null
  onSuccess: () => void
  fixedClientId?: string
}

export function SaleFormModal({
  open,
  onOpenChange,
  saleId,
  onSuccess,
  fixedClientId,
}: SaleFormModalProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      clientId: fixedClientId || '',
      car: '',
      value: 0,
      commission: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    },
  })

  useEffect(() => {
    const loadClients = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const data = await crmService.getClients(user.id)
          setClients(data)
        }
      } catch (error) {
        console.error('Error loading clients', error)
      }
    }

    const loadSale = async (id: string) => {
      setIsLoading(true)
      try {
        const sale = await salesService.getSale(id)
        if (sale) {
          form.reset({
            clientId: sale.clientId || '',
            car: sale.car,
            value: sale.saleValue || 0,
            commission: sale.commission,
            date: format(sale.date, 'yyyy-MM-dd'),
            status: sale.status || 'pending',
          })
        }
      } catch (error) {
        toast({
          title: 'Erro ao carregar venda',
          variant: 'destructive',
        })
        onOpenChange(false)
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadClients()
      if (saleId) {
        loadSale(saleId)
      } else {
        form.reset({
          clientId: fixedClientId || '',
          car: '',
          value: 0,
          commission: 0,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
        })
      }
    }
  }, [open, saleId, fixedClientId, form, toast, onOpenChange])

  const onSubmit = async (values: SaleFormValues) => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const finalClientId = fixedClientId || values.clientId
      const selectedClient = clients.find((c) => c.id === finalClientId)
      const clientName = selectedClient ? selectedClient.full_name : 'Cliente'

      const saleData = {
        ...values,
        date: parseISO(values.date),
        clientId: finalClientId,
        client: clientName,
        userId: user.id,
        saleValue: values.value,
      }

      if (saleId) {
        await salesService.updateSale(saleId, saleData)
        toast({ title: 'Venda atualizada com sucesso' })
      } else {
        await salesService.createSale(saleData)
        toast({ title: 'Venda criada com sucesso' })
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao salvar venda',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{saleId ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
          <DialogDescription>
            Preencha os dados da venda abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={!!fixedClientId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="car"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veículo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Honda Civic 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Venda (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Venda</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Pagamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
