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
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { salesService } from '@/services/salesService'
import { crmService } from '@/services/crmService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { Client, Sale } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { parseISO, format } from 'date-fns'
import { ClientFormSection } from './forms/ClientFormSection'
import { VehicleFormSection } from './forms/VehicleFormSection'
import { FinancialFormSection } from './forms/FinancialFormSection'

const saleSchema = z
  .object({
    type: z.enum(['Venda', 'Compra']).default('Venda'),
    date: z.string().min(1, 'Data é obrigatória'),

    // Client Fields
    clientId: z.string().optional(),
    newClientName: z.string().optional(),
    newClientBirth: z.string().optional(),
    newClientCity: z.string().optional(),
    newClientPhone: z.string().optional(),
    newClientEmail: z
      .string()
      .email('Email inválido')
      .optional()
      .or(z.literal('')),

    // Vehicle Fields
    car: z.string().min(1, 'Modelo do veículo é obrigatório'),
    year: z.coerce
      .number()
      .min(1900, 'Ano inválido')
      .max(new Date().getFullYear() + 2, 'Ano inválido'),
    plate: z.string().optional(),

    // Financial Fields
    saleValue: z.coerce.number().optional(),
    financedValue: z.coerce.number().optional(),
    commission: z.coerce.number().min(0, 'Comissão não pode ser negativa'),
    returnType: z.string().optional(),
    gestauto: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // If no clientId is selected, ensure we have a new client name
    if (!data.clientId && !data.newClientName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione um cliente ou crie um novo',
        path: ['clientId'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nome é obrigatório para novo cliente',
        path: ['newClientName'],
      })
    }
  })

type SaleFormValues = z.infer<typeof saleSchema>

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId?: string | null
  saleToEdit?: Sale | undefined // Consistent naming
  onSuccess?: () => void
  fixedClientId?: string
}

export function SaleFormModal({
  open,
  onOpenChange,
  saleId,
  saleToEdit,
  onSuccess,
  fixedClientId,
}: SaleFormModalProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isNewClient, setIsNewClient] = useState(false)

  // Determine if we are editing
  const initialData = saleToEdit
  const isEditing = !!initialData || !!saleId

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      type: 'Venda',
      date: new Date().toISOString().split('T')[0],
      clientId: fixedClientId || '',
      newClientName: '',
      newClientBirth: '',
      newClientCity: '',
      newClientPhone: '',
      newClientEmail: '',
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

    if (open) {
      loadClients()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Populate form for editing
        form.reset({
          type: initialData.type || 'Venda',
          date: format(initialData.date, 'yyyy-MM-dd'),
          clientId: initialData.clientId || '',
          car: initialData.car,
          year: initialData.year || new Date().getFullYear(),
          plate: initialData.plate || '',
          saleValue: initialData.saleValue || 0,
          financedValue: initialData.financedValue || 0,
          commission: initialData.commission,
          returnType: initialData.returnType || '',
          // Handle Gestauto mapping: "Sim" -> true, "Não" -> false, null -> false
          gestauto:
            initialData.gestauto === 'Sim' || initialData.gestauto === 'Ativo',
        })
        setIsNewClient(false)
      } else {
        // Reset for new entry
        form.reset({
          type: 'Venda',
          date: new Date().toISOString().split('T')[0],
          clientId: fixedClientId || '',
          newClientName: '',
          newClientBirth: '',
          newClientCity: '',
          newClientPhone: '',
          newClientEmail: '',
          car: '',
          year: new Date().getFullYear(),
          plate: '',
          saleValue: 0,
          financedValue: 0,
          commission: 0,
          returnType: '',
          gestauto: false,
        })
        setIsNewClient(false)
      }
    }
  }, [open, initialData, fixedClientId, form])

  const handleFormSubmit = async (values: SaleFormValues) => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let finalClientId = values.clientId
      let clientName = ''

      // 1. Handle Client Creation if needed
      if (isNewClient || !finalClientId) {
        if (values.newClientName) {
          const newClient = await clientService.createClient({
            full_name: values.newClientName,
            birth_date: values.newClientBirth || undefined,
            city: values.newClientCity || undefined,
            phone: values.newClientPhone || undefined,
            email: values.newClientEmail || undefined,
            status: 'client',
          })
          finalClientId = newClient.id
          clientName = newClient.full_name
        }
      } else {
        const selected = clients.find((c) => c.id === finalClientId)
        clientName = selected ? selected.full_name : 'Cliente'
      }

      if (!finalClientId) throw new Error('Cliente obrigatório')

      // 2. Prepare Sale Data
      const saleData = {
        type: values.type,
        date: parseISO(values.date),
        clientId: finalClientId,
        client: clientName, // Snapshot name
        car: values.car,
        year: values.year,
        plate: values.plate,
        saleValue: values.saleValue,
        financedValue: values.financedValue,
        commission: values.commission,
        returnType: values.returnType,
        gestauto: values.gestauto ? 'Sim' : 'Não', // Map boolean back to string
        status: 'pending' as const,
        userId: user.id,
      }

      // 3. Save Sale
      if (initialData && initialData.id) {
        await salesService.updateSale(initialData.id, saleData)
        toast({ title: 'Operação atualizada com sucesso' })
      } else if (saleId) {
        await salesService.updateSale(saleId, saleData)
        toast({ title: 'Operação atualizada com sucesso' })
      } else {
        await salesService.createSale(saleData)
        toast({ title: 'Nova operação registrada com sucesso' })
      }

      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro ao salvar operação',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1000px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex flex-col h-full"
          >
            {/* Header Section */}
            <div className="px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background sticky top-0 z-10">
              <div>
                <DialogTitle className="text-xl">
                  {isEditing ? 'Editar Operação' : 'Nova Operação'}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados da venda ou compra.
                </DialogDescription>
              </div>

              <div className="flex items-center gap-4">
                {/* Date Picker */}
                <div className="relative">
                  <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    className="w-[160px] pl-9"
                    {...form.register('date')}
                  />
                </div>

                {/* Operation Type Tabs */}
                <Tabs
                  value={form.watch('type')}
                  onValueChange={(v) =>
                    form.setValue('type', v as 'Venda' | 'Compra')
                  }
                  className="w-[180px]"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="Venda"
                      className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                    >
                      Venda
                    </TabsTrigger>
                    <TabsTrigger
                      value="Compra"
                      className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                    >
                      Compra
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Main Content - 2 Column Grid */}
            <div className="flex-1 p-6 bg-muted/10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Left Column: Client */}
                <div className="bg-card rounded-lg border p-4 shadow-sm h-full">
                  <ClientFormSection
                    form={form}
                    clients={clients}
                    isNewClient={isNewClient}
                    setIsNewClient={setIsNewClient}
                  />
                </div>

                {/* Right Column: Vehicle & Financial */}
                <div className="space-y-6">
                  <div className="bg-card rounded-lg border p-4 shadow-sm">
                    <VehicleFormSection form={form} />
                  </div>

                  <div className="bg-card rounded-lg border p-4 shadow-sm">
                    <FinancialFormSection form={form} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="p-6 border-t bg-background sticky bottom-0 z-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[150px]"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Atualizar Operação' : 'Salvar Operação'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
