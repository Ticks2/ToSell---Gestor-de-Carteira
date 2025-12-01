import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Sale } from '@/types'
import { salesService } from '@/services/salesService'
import { toast } from 'sonner'

const formSchema = z.object({
  data_venda: z.string().min(1, 'Data é obrigatória'),
  carro: z.string().min(1, 'Carro é obrigatório'),
  ano_carro: z.coerce.number().min(1900, 'Ano inválido'),
  placa: z.string().optional(),
  nome_cliente: z.string().min(1, 'Nome do cliente é obrigatório'),
  gestauto: z.string().optional(),
  valor_financiado: z.coerce.number().optional(),
  retorno: z.string().optional(),
  tipo_operacao: z.string().min(1, 'Tipo é obrigatório'),
  valor_comissao: z.coerce.number().min(0, 'Comissão não pode ser negativa'),
})

interface SaleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale?: Sale | null
  onSuccess: () => void
}

export function SaleFormModal({
  open,
  onOpenChange,
  sale,
  onSuccess,
}: SaleFormModalProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_venda: sale?.data_venda ?? new Date().toISOString().split('T')[0],
      carro: sale?.carro ?? '',
      ano_carro: sale?.ano_carro ?? new Date().getFullYear(),
      placa: sale?.placa ?? '',
      nome_cliente: sale?.nome_cliente ?? '',
      gestauto: sale?.gestauto ?? 'Não',
      valor_financiado: sale?.valor_financiado ?? 0,
      retorno: sale?.retorno ?? '',
      tipo_operacao: sale?.tipo_operacao ?? 'Venda',
      valor_comissao: sale?.valor_comissao ?? 0,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (sale?.id) {
        await salesService.updateSale(sale.id, values)
        toast.success('Venda atualizada com sucesso!')
      } else {
        await salesService.createSale(values)
        toast.success('Venda criada com sucesso!')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao salvar venda')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sale ? 'Editar Venda' : 'Nova Venda'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_venda"
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
                name="tipo_operacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Veículo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Corolla XEI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ano_carro"
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nome_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valor_comissao"
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
                name="valor_financiado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financiado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
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
                    <FormLabel>Gestauto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
