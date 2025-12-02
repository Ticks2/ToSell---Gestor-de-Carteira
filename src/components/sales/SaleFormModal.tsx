import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Car,
  DollarSign,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { salesService } from '@/services/salesService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/use-toast'
import { Client, Sale } from '@/types'
import { supabase } from '@/lib/supabase/client'

const saleSchema = z
  .object({
    // Vehicle Data
    car: z.string().min(1, 'Modelo do veículo é obrigatório'),
    year: z.coerce
      .number()
      .min(1900, 'Ano inválido')
      .max(new Date().getFullYear() + 1, 'Ano inválido'),
    plate: z.string().optional(),
    type: z.enum(['Venda', 'Compra']).default('Venda'),

    // Financial Data
    saleValue: z.coerce.number().min(0.01, 'Valor da venda é obrigatório'),
    financedValue: z.coerce.number().optional(),
    commission: z.coerce.number().min(0, 'Comissão não pode ser negativa'),
    returnType: z.string().optional(),
    gestauto: z.boolean().default(false),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
    status: z.enum(['pending', 'paid']).default('pending'),

    // Client Data
    clientMode: z.enum(['existing', 'new']).default('existing'),
    clientId: z.string().optional(),

    // New Client Fields
    newClientName: z.string().optional(),
    newClientBirthDate: z.string().optional(),
    newClientCity: z.string().optional(),
    newClientPhone: z.string().optional(),
    newClientEmail: z
      .string()
      .email('Email inválido')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.clientMode === 'existing') {
      if (!data.clientId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione um cliente existente',
          path: ['clientId'],
        })
      }
    } else {
      if (!data.newClientName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nome do cliente é obrigatório',
          path: ['newClientName'],
        })
      }
    }
  })

type SaleFormValues = z.infer<typeof saleSchema>

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  saleToEdit?: Sale
  fixedClientId?: string
}

export function SaleFormModal({
  open,
  onOpenChange,
  onSuccess,
  saleToEdit,
  fixedClientId,
}: SaleFormModalProps) {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false)

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      car: '',
      year: new Date().getFullYear(),
      plate: '',
      type: 'Venda',
      saleValue: 0,
      financedValue: 0,
      commission: 0,
      returnType: '',
      gestauto: false,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      clientMode: 'existing',
      clientId: '',
      newClientName: '',
      newClientBirthDate: '',
      newClientCity: '',
      newClientPhone: '',
      newClientEmail: '',
    },
  })

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await clientService.getClients()
        setClients(data)
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
      if (saleToEdit) {
        form.reset({
          car: saleToEdit.car,
          year: saleToEdit.year,
          plate: saleToEdit.plate || '',
          type: saleToEdit.type,
          saleValue: saleToEdit.saleValue || 0,
          financedValue: saleToEdit.financedValue || 0,
          commission: saleToEdit.commission,
          returnType: saleToEdit.returnType || '',
          gestauto: saleToEdit.gestauto,
          date: format(saleToEdit.date, 'yyyy-MM-dd'),
          status: saleToEdit.status || 'pending',
          clientMode: 'existing',
          clientId: saleToEdit.clientId || '',
        })

        // Find and set selected client for display
        if (saleToEdit.clientId) {
          // We need to wait for clients to load or use clientDetails if available
          if (saleToEdit.clientDetails) {
            setSelectedClient(saleToEdit.clientDetails)
          } else {
            // Fallback will happen when clients list is loaded and we match ID
            const client = clients.find((c) => c.id === saleToEdit.clientId)
            if (client) setSelectedClient(client)
          }
        }
      } else {
        form.reset({
          car: '',
          year: new Date().getFullYear(),
          plate: '',
          type: 'Venda',
          saleValue: 0,
          financedValue: 0,
          commission: 0,
          returnType: '',
          gestauto: false,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          clientMode: fixedClientId ? 'existing' : 'existing',
          clientId: fixedClientId || '',
          newClientName: '',
          newClientBirthDate: '',
          newClientCity: '',
          newClientPhone: '',
          newClientEmail: '',
        })
        if (fixedClientId) {
          const client = clients.find((c) => c.id === fixedClientId)
          if (client) setSelectedClient(client)
        } else {
          setSelectedClient(null)
        }
      }
    }
  }, [open, saleToEdit, fixedClientId, form, clients])

  const onSubmit = async (values: SaleFormValues) => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let finalClientId = values.clientId
      let finalClientName = ''

      if (values.clientMode === 'new') {
        // Create new client
        const newClientData = {
          full_name: values.newClientName!,
          birth_date: values.newClientBirthDate || null,
          city: values.newClientCity || null,
          phone: values.newClientPhone || null,
          email: values.newClientEmail || null,
          status: 'client' as const,
        }
        const createdClient = await clientService.createClient(newClientData)
        finalClientId = createdClient.id
        finalClientName = createdClient.full_name
      } else {
        // Existing client
        const client = clients.find((c) => c.id === values.clientId)
        if (client) {
          finalClientName = client.full_name
        }
      }

      const saleData = {
        date: parseISO(values.date),
        car: values.car,
        year: values.year,
        plate: values.plate,
        client: finalClientName,
        clientId: finalClientId,
        saleValue: values.saleValue,
        financedValue: values.financedValue,
        commission: values.commission,
        returnType: values.returnType,
        gestauto: values.gestauto,
        type: values.type,
        status: values.status,
      }

      if (saleToEdit) {
        await salesService.updateSale(saleToEdit.id, saleData)
        toast({ title: 'Venda atualizada com sucesso' })
      } else {
        await salesService.createSale(saleData)
        toast({ title: 'Venda criada com sucesso' })
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {saleToEdit ? 'Editar Operação' : 'Nova Operação'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da operação abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Vehicle Data */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Car className="h-5 w-5" />
                <h3>Dados do Veículo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="car"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Modelo do Veículo *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Honda Civic Touring"
                          {...field}
                        />
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
                      <FormLabel>Ano Modelo *</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
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
                  name="type"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tipo de Operação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
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
              </div>
            </div>

            <Separator />

            {/* Section 2: Financial Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <DollarSign className="h-5 w-5" />
                <h3>Detalhes Financeiros</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="saleValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Venda (R$) *</FormLabel>
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
                      <FormLabel>Valor Financiado (R$)</FormLabel>
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
                <FormField
                  control={form.control}
                  name="returnType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retorno / Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Santander" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Operação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gestauto"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Gestauto</FormLabel>
                        <FormDescription>
                          Veículo possui garantia Gestauto?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Section 3: Client Data */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <User className="h-5 w-5" />
                <h3>Dados do Cliente</h3>
              </div>

              <Tabs
                defaultValue={form.watch('clientMode')}
                onValueChange={(v) =>
                  form.setValue('clientMode', v as 'existing' | 'new')
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="existing" disabled={!!fixedClientId}>
                    Buscar Cliente Existente
                  </TabsTrigger>
                  <TabsTrigger value="new" disabled={!!fixedClientId}>
                    Novo Cliente
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="existing" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Selecionar Cliente *</FormLabel>
                        <Popover
                          open={isClientSelectOpen}
                          onOpenChange={setIsClientSelectOpen}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                disabled={!!fixedClientId}
                                className={cn(
                                  'w-full justify-between',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value
                                  ? clients.find(
                                      (client) => client.id === field.value,
                                    )?.full_name
                                  : 'Buscar cliente...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar cliente..." />
                              <CommandList>
                                <CommandEmpty>
                                  Nenhum cliente encontrado.
                                </CommandEmpty>
                                <CommandGroup>
                                  {clients.map((client) => (
                                    <CommandItem
                                      value={client.full_name}
                                      key={client.id}
                                      onSelect={() => {
                                        form.setValue('clientId', client.id)
                                        setSelectedClient(client)
                                        setIsClientSelectOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          client.id === field.value
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{client.full_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {client.email}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedClient && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Nome:
                          </span>
                          <p>{selectedClient.full_name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Data Nasc.:
                          </span>
                          <p>
                            {selectedClient.birth_date
                              ? format(
                                  parseISO(selectedClient.birth_date),
                                  'dd/MM/yyyy',
                                )
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Cidade:
                          </span>
                          <p>{selectedClient.city || '-'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">
                            Telefone:
                          </span>
                          <p>{selectedClient.phone || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-muted-foreground">
                            Email:
                          </span>
                          <p>{selectedClient.email || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="new" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="newClientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do Cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="newClientBirthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newClientPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="newClientCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newClientEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@exemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
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
