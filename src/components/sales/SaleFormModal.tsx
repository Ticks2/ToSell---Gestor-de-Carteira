import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Sale } from '@/types'
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
import { useEffect } from 'react'

const saleSchema = z.object({
  type: z.enum(['Venda', 'Compra']),
  date: z.string().refine((val) => new Date(val) <= new Date(), {
    message: 'A data não pode ser futura',
  }),
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
      {
        message: 'Formato de placa inválido (AAA-9999 ou AAA-9A99)',
      },
    ),
  client: z.string().min(2, 'Nome do cliente é obrigatório'),
  gestauto: z.boolean().default(false),
  financedValue: z.coerce.number().optional(),
  returnType: z.enum(['R1', 'R2', 'R3', 'R4', 'R5']).optional(),
  commission: z.coerce
    .number()
    .min(1, 'Valor da comissão deve ser maior que zero'),
})

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: z.infer<typeof saleSchema>) => void
  initialData?: Sale
}

export function SaleFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: SaleFormModalProps) {
  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      type: 'Venda',
      date: new Date().toISOString().split('T')[0],
      car: '',
      year: new Date().getFullYear(),
      plate: '',
      client: '',
      gestauto: false,
      financedValue: 0,
      returnType: undefined,
      commission: 0,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          type: initialData.type,
          date: initialData.date.toISOString().split('T')[0],
          car: initialData.car,
          year: initialData.year,
          plate: initialData.plate || '',
          client: initialData.client,
          gestauto: initialData.gestauto || false,
          financedValue: initialData.financedValue || 0,
          returnType: initialData.returnType,
          commission: initialData.commission,
        })
      } else {
        form.reset({
          type: 'Venda',
          date: new Date().toISOString().split('T')[0],
          car: '',
          year: new Date().getFullYear(),
          plate: '',
          client: '',
          gestauto: false,
          financedValue: 0,
          returnType: undefined,
          commission: 0,
        })
      }
    }
  }, [open, initialData, form])

  const suggestedCommissions =
    form.watch('type') === 'Venda' ? [400, 450, 500, 600, 650, 800] : [600, 650]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Operação' : 'Nova Operação'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ToggleGroup
                      type="single"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="justify-start"
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="car"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carro</FormLabel>
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
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do Cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="gestauto"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full">
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
              <FormField
                control={form.control}
                name="returnType"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Retorno</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="financedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Financiado</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
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
