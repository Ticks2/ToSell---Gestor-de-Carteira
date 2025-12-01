import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { parse, format } from 'date-fns'
import { Sale, Client } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { useEffect, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { clientService } from '@/services/clientService'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const saleSchema = z.object({
  type: z.enum(['Venda', 'Compra']),
  date: z.string().refine(
    (val) => {
      // Validating date string YYYY-MM-DD
      return !isNaN(Date.parse(val))
    },
    { message: 'Data inválida' },
  ),
  // Vehicle Data
  car: z.string().min(2, 'Nome do carro é obrigatório'),
  year: z.coerce
    .number()
    .min(1980)
    .max(new Date().getFullYear() + 1),
  plate: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[A-Z]{3}-\d[A-Z0-9]\d{2}$|^[A-Z]{3}-\d{4}$/.test(val),
      { message: 'Formato de placa inválido (AAA-9999 ou AAA-9A99)' },
    ),

  // Client Data
  clientId: z.string().optional(),
  clientName: z.string().min(2, 'Nome do cliente é obrigatório'),
  clientBirthDate: z.string().optional(),
  clientCity: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),

  // Financial Data
  saleValue: z.coerce.number().min(0),
  financedValue: z.coerce.number().optional(),
  commission: z.coerce
    .number()
    .min(0.01, 'Valor da comissão deve ser maior que zero'),

  // Optionals
  gestauto: z.boolean().default(false),
  returnType: z.enum(['R1', 'R2', 'R3', 'R4', 'R5']).optional(),
})

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  initialData?: Sale
}

export function SaleFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: SaleFormModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [openClientSearch, setOpenClientSearch] = useState(false)

  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      type: 'Venda',
      date: format(new Date(), 'yyyy-MM-dd'),
      car: '',
      year: new Date().getFullYear(),
      plate: '',
      clientName: '',
      clientId: '',
      clientBirthDate: '',
      clientCity: '',
      clientPhone: '',
      clientEmail: '',
      saleValue: 0,
      financedValue: 0,
      commission: 0,
      gestauto: false,
      returnType: undefined,
    },
  })

  useEffect(() => {
    if (open) {
      loadClients()
      if (initialData) {
        form.reset({
          type: initialData.type,
          date: format(initialData.date, 'yyyy-MM-dd'),
          car: initialData.car,
          year: initialData.year,
          plate: initialData.plate || '',
          clientId: initialData.clientId || '',
          clientName:
            initialData.clientDetails?.full_name || initialData.client,
          clientBirthDate: initialData.clientDetails?.birth_date || '',
          clientCity: initialData.clientDetails?.city || '',
          clientPhone: initialData.clientDetails?.phone || '',
          clientEmail: initialData.clientDetails?.email || '',
          saleValue: initialData.saleValue || 0,
          financedValue: initialData.financedValue || 0,
          commission: initialData.commission,
          gestauto: initialData.gestauto || false,
          returnType: initialData.returnType,
        })
      } else {
        form.reset({
          type: 'Venda',
          date: format(new Date(), 'yyyy-MM-dd'),
          car: '',
          year: new Date().getFullYear(),
          plate: '',
          clientName: '',
          clientId: '',
          clientBirthDate: '',
          clientCity: '',
          clientPhone: '',
          clientEmail: '',
          saleValue: 0,
          financedValue: 0,
          commission: 0,
          gestauto: false,
          returnType: undefined,
        })
      }
    }
  }, [open, initialData, form])

  const loadClients = async () => {
    try {
      const data = await clientService.getClients()
      setClients(data)
    } catch (error) {
      console.error('Failed to load clients', error)
    }
  }

  const handleFormSubmit = async (values: z.infer<typeof saleSchema>) => {
    // Prepare data for submission
    let clientId = values.clientId

    // If no clientId or if user modified name/details, we might need to create/update client
    // For simplicity: if clientId exists, update client. If not, create new.
    // Note: The main `onSubmit` prop expects `Sale` structure mostly.
    // We'll handle client logic here or let the service handle it?
    // Since `createSale` in service expects client info to be handled or passed.
    // Let's create/update client here first.

    try {
      if (clientId) {
        // Update existing client if details changed
        await clientService.updateClient(clientId, {
          full_name: values.clientName,
          birth_date: values.clientBirthDate || null,
          city: values.clientCity || null,
          phone: values.clientPhone || null,
          email: values.clientEmail || null,
        })
      } else {
        // Create new client
        const newClient = await clientService.createClient({
          full_name: values.clientName,
          birth_date: values.clientBirthDate || null,
          city: values.clientCity || null,
          phone: values.clientPhone || null,
          email: values.clientEmail || null,
        })
        clientId = newClient.id
      }

      // Now submit sale with client info
      const saleData = {
        ...values,
        date: parse(values.date, 'yyyy-MM-dd', new Date()), // Ensure correct date object
        client: values.clientName, // Fallback name
        clientId: clientId,
      }

      onSubmit(saleData)
    } catch (err) {
      console.error('Error processing client/sale', err)
    }
  }

  const onSelectClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      form.setValue('clientId', client.id)
      form.setValue('clientName', client.full_name)
      form.setValue('clientBirthDate', client.birth_date || '')
      form.setValue('clientCity', client.city || '')
      form.setValue('clientPhone', client.phone || '')
      form.setValue('clientEmail', client.email || '')
      setOpenClientSearch(false)
    }
  }

  const suggestedCommissions =
    form.watch('type') === 'Venda' ? [400, 450, 500, 600, 650, 800] : [600, 650]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Operação' : 'Nova Operação'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-6"
          >
            {/* Operation Type & Date */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-muted/30 p-4 rounded-lg">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <ToggleGroupItem
                          value="Venda"
                          className="w-24 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                          Venda
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="Compra"
                          className="w-24 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                          Compra
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormLabel className="whitespace-nowrap">
                      Data da Venda:
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="w-auto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Vehicle & Financial */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Dados do Veículo
                    <Separator className="flex-1" />
                  </h3>

                  <FormField
                    control={form.control}
                    name="car"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo do Carro</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Honda Civic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano Modelo</FormLabel>
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
                          <FormLabel>Placa (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="AAA-9999"
                              {...field}
                              className="uppercase"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Detalhes Financeiros
                    <Separator className="flex-1" />
                  </h3>

                  <FormField
                    control={form.control}
                    name="saleValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Venda</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-2.5 text-muted-foreground">
                              R$
                            </span>
                            <Input
                              type="number"
                              className="pl-8"
                              placeholder="0.00"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="financedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Financiado</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-2 top-2.5 text-muted-foreground">
                                R$
                              </span>
                              <Input
                                type="number"
                                className="pl-8"
                                placeholder="0.00"
                                {...field}
                              />
                            </div>
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
                            <div className="relative">
                              <span className="absolute left-2 top-2.5 text-muted-foreground">
                                R$
                              </span>
                              <Input
                                type="number"
                                className="pl-8"
                                placeholder="0.00"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {suggestedCommissions.map((val) => (
                              <Button
                                key={val}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => form.setValue('commission', val)}
                              >
                                {val}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="returnType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Retorno (Opcional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="R1">R1</SelectItem>
                              <SelectItem value="R2">R2</SelectItem>
                              <SelectItem value="R3">R3</SelectItem>
                              <SelectItem value="R4">R4</SelectItem>
                              <SelectItem value="R5">R5</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gestauto"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto">
                          <div className="space-y-0.5">
                            <FormLabel>Gestauto</FormLabel>
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
              </div>

              {/* Right Column: Client Data */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Dados do Cliente
                    <Separator className="flex-1" />
                  </h3>

                  <div className="flex flex-col gap-2">
                    <FormLabel>Buscar Cliente Existente</FormLabel>
                    <Popover
                      open={openClientSearch}
                      onOpenChange={setOpenClientSearch}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openClientSearch}
                          className="w-full justify-between"
                        >
                          {form.watch('clientName')
                            ? form.watch('clientName')
                            : 'Selecionar cliente...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Buscar cliente..." />
                          <CommandList>
                            <CommandEmpty>
                              Nenhum cliente encontrado.
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  form.setValue('clientId', '')
                                  form.setValue('clientName', '')
                                  form.setValue('clientBirthDate', '')
                                  form.setValue('clientCity', '')
                                  form.setValue('clientPhone', '')
                                  form.setValue('clientEmail', '')
                                  setOpenClientSearch(false)
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Cliente
                              </CommandItem>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.full_name}
                                  onSelect={() => onSelectClient(client.id)}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      form.watch('clientId') === client.id
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                    )}
                                  />
                                  {client.full_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do Cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientBirthDate"
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
                    name="clientCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade - UF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientPhone"
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

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="cliente@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
