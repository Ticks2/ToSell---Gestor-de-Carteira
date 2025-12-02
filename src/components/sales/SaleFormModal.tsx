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
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { parseISO, format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'

const saleSchema = z.object({
  client: z.string().min(1, 'Nome do cliente é obrigatório'),
  car: z.string().min(1, 'Veículo é obrigatório'),
  year: z.coerce.number().min(1900, 'Ano inválido').max(2100, 'Ano inválido'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  type: z.string().min(1, 'Tipo de operação é obrigatório'),
  commission: z.coerce.number(),
  plate: z.string().optional(),
  gestauto: z.string().optional(),
  returnType: z.string().optional(),
  financedValue: z.coerce.number().optional(),
  saleValue: z.coerce.number().optional(),
  // Hidden/Internal fields
  clientId: z.string().optional(),
  status: z.enum(['pending', 'paid']).default('pending'),
})

type SaleFormValues = z.infer<typeof saleSchema>

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId?: string | null
  onSuccess: () => void
  fixedClientId?: string
  initialData?: any // Added to support direct data passing if needed
}

export function SaleFormModal({
  open,
  onOpenChange,
  saleId,
  onSuccess,
  fixedClientId,
  initialData,
}: SaleFormModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      client: '',
      car: '',
      year: new Date().getFullYear(),
      date: new Date().toISOString().split('T')[0],
      type: 'Venda',
      commission: 0,
      plate: '',
      gestauto: '',
      returnType: '',
      financedValue: 0,
      saleValue: 0,
      clientId: fixedClientId || '',
      status: 'pending',
    },
  })

  useEffect(() => {
    const loadSale = async (id: string) => {
      setIsLoading(true)
      try {
        const sale = await salesService.getSale(id)
        if (sale) {
          form.reset({
            client: sale.client,
            car: sale.car,
            year: sale.year || new Date().getFullYear(),
            date: format(sale.date, 'yyyy-MM-dd'),
            type: sale.type,
            commission: sale.commission,
            plate: sale.plate || '',
            gestauto: sale.gestauto || '',
            returnType: sale.returnType || '',
            financedValue: sale.financedValue || 0,
            saleValue: sale.saleValue || 0,
            clientId: sale.clientId || '',
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
      if (saleId) {
        loadSale(saleId)
      } else if (initialData) {
        // If initialData is passed (e.g. from client details or edit button)
        form.reset({
          client: initialData.client || initialData.full_name || '', // Handle Client object or Sale object
          car: initialData.car || '',
          year: initialData.year || new Date().getFullYear(),
          date: initialData.date
            ? format(new Date(initialData.date), 'yyyy-MM-dd')
            : new Date().toISOString().split('T')[0],
          type: initialData.type || 'Venda',
          commission: initialData.commission || 0,
          plate: initialData.plate || '',
          gestauto: initialData.gestauto || '',
          returnType: initialData.returnType || '',
          financedValue: initialData.financedValue || 0,
          saleValue: initialData.saleValue || 0,
          clientId: initialData.clientId || initialData.id || '', // If it's a client object, id is clientId
          status: initialData.status || 'pending',
        })
      } else {
        // Reset for new entry
        form.reset({
          client: '',
          car: '',
          year: new Date().getFullYear(),
          date: new Date().toISOString().split('T')[0],
          type: 'Venda',
          commission: 0,
          plate: '',
          gestauto: '',
          returnType: '',
          financedValue: 0,
          saleValue: 0,
          clientId: fixedClientId || '',
          status: 'pending',
        })
      }
    }
  }, [open, saleId, fixedClientId, initialData, form, toast, onOpenChange])

  const onSubmit = async (values: SaleFormValues) => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const saleData = {
        ...values,
        date: parseISO(values.date),
        userId: user.id,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{saleId ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
          <DialogDescription>
            Preencha os dados da operação abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Nome do Cliente */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 2: Carro, Ano */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="car"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carro</FormLabel>
                    <FormControl>
                      <Input placeholder="Modelo do veículo" {...field} />
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
                    <FormLabel>Ano do Carro</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Data, Tipo */}
            <div className="grid grid-cols-2 gap-4">
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operação</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Venda">Venda</SelectItem>
                        <SelectItem value="Compra">Compra</SelectItem>
                        <SelectItem value="Troca">Troca</SelectItem>
                        <SelectItem value="Financiamento">
                          Financiamento
                        </SelectItem>
                        <SelectItem value="Consignação">Consignação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Valor Comissão */}
            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Comissão (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 5: Placa, Gestauto */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-1234"
                        {...field}
                        className="uppercase"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gestauto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestauto (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Informação Gestauto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 6: Retorno */}
            <FormField
              control={form.control}
              name="returnType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retorno (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Informação de Retorno" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Row 7: Valor Financiado, Valor Venda */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="financedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Financiado (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saleValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Venda (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
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
