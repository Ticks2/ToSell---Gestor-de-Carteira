import { UseFormReturn } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { Switch } from '@/components/ui/switch'
import { DollarSign } from 'lucide-react'

interface FinancialFormSectionProps {
  form: UseFormReturn<any>
}

export function FinancialFormSection({ form }: FinancialFormSectionProps) {
  return (
    <div className="space-y-4 pt-2">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        Detalhes Financeiros
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="saleValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor da Venda</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                />
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
              <FormLabel>Valor Financiado</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="commission"
          render={({ field }) => (
            <FormItem className="col-span-2 sm:col-span-1">
              <FormLabel>Comissão *</FormLabel>
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

        <FormField
          control={form.control}
          name="returnType"
          render={({ field }) => (
            <FormItem className="col-span-2 sm:col-span-1">
              <FormLabel>Retorno</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
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
                  <SelectItem value="R6">R6</SelectItem>
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
            <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Garantia Gestauto</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Ativar para incluir garantia
                </div>
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
  )
}
