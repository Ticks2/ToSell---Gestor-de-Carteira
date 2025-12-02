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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { salesService } from '@/services/salesService'
import { crmService } from '@/services/crmService'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { Client, Sale } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { parseISO, format } from 'date-fns'

const saleSchema = z.object({
  type: z.enum(['Venda', 'Compra']).default('Venda'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  status: z.enum(['pending', 'paid']).default('pending'),
  clientId: z.string().min(1, 'Cliente é obrigatório'),
  car: z.string().min(1, 'Veículo é obrigatório'),
  year: z.coerce
    .number()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear() + 2, 'Ano inválido'),
  plate: z.string().optional(),
  saleValue: z.coerce.number().min(0, 'Valor inválido'),
  financedValue: z.coerce.number().optional(),
  commission: z.coerce.number().min(0, 'Comissão não pode ser negativa'),
  returnType: z.string().optional(),
  gestauto: z.boolean().default(false),
})

type SaleFormValues = z.infer<typeof saleSchema>

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId?: string | null
  initialData?: Sale | undefined
  onSuccess?: () => void
  onSubmit?: (data: any) => Promise<void>
  fixedClientId?: string
}

export function SaleFormModal({
  open,
  onOpenChange,
  saleId,
  initialData,
  onSuccess,
  onSubmit,
  fixedClientId,
}: SaleFormModalProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      type: 'Venda',
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      clientId: fixedClientId || '',
      car: '',
      year: new Date().getFullYear(),
      plate: '',
      saleValue: 0,
      financedValue: 0,
      commission: 0,
      returnType: '',
      gestauto: false,
    },
  })

  // Load clients and sale data
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
          populateForm(sale)
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

    const populateForm = (sale: Sale) => {
      form.reset({
        type: sale.type || 'Venda',
        date: format(sale.date, 'yyyy-MM-dd'),
        status: sale.status || 'pending',
        clientId: sale.clientId || '',
        car: sale.car,
        year: sale.year || new Date().getFullYear(),
        plate: sale.plate || '',
        saleValue: sale.saleValue || 0,
        financedValue: sale.financedValue || 0,
        commission: sale.commission,
        returnType: sale.returnType || '',
        gestauto: sale.gestauto || false,
      })
    }

    if (open) {
      loadClients()
      if (initialData) {
        populateForm(initialData)
      } else if (saleId) {
        loadSale(saleId)
      } else {
        // Reset to defaults for new sale
        form.reset({
          type: 'Venda',
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          clientId: fixedClientId || '',
          car: '',
          year: new Date().getFullYear(),
          plate: '',
          saleValue: 0,
          financedValue: 0,
          commission: 0,
          returnType: '',
          gestauto: false,
        })
      }
    }
  }, [open, saleId, initialData, fixedClientId, form, toast, onOpenChange])

  const handleFormSubmit = async (values: SaleFormValues) => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const finalClientId = fixedClientId || values.clientId
      const selectedClient = clients.find((c) => c.id === finalClientId)
      const clientName = selectedClient ? selectedClient.full_name : 'Cliente'

      // Prepare data in Sale object structure (minus id/created_at)
      const saleData = {
        ...values,
        date: parseISO(values.date),
        clientId: finalClientId,
        client: clientName,
        userId: user.id,
        // Ensure number fields are valid numbers or null if optional logic dictates (zod handles defaults)
        financedValue: values.financedValue || 0,
        saleValue: values.saleValue || 0,
      }

      if (onSubmit) {
        // External handler (e.g. VendasMensais)
        await onSubmit(saleData)
      } else {
        // Internal handler (e.g. ClientDetails)
        if (saleId) {
          await salesService.updateSale(saleId, saleData)
          toast({ title: 'Venda atualizada com sucesso' })
        } else {
          await salesService.createSale(saleData)
          toast({ title: 'Venda criada com sucesso' })
        }
      }

      if (onSuccess) onSuccess()
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {saleId || initialData ? 'Editar Operação' : 'Nova Operação'}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da venda ou compra abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
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
                        <SelectItem value="Venda">Venda</SelectItem>
                        <SelectItem value="Compra">Compra</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
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
            </div>

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
                        <SelectValue placeholder="Selecione o cliente" />
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

            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="car"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Veículo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Honda Civic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="YYYY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-1234"
                        className="uppercase"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="saleValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Venda</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="financedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financiado</FormLabel>
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
                    <FormLabel>Comissão</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        className="font-bold text-green-600"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <FormField
                control={form.control}
                name="returnType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retorno / Banco</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: BV Financeira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gestauto"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 h-10 items-center">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Garantia Gestauto</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Operação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
