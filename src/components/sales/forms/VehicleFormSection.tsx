import { UseFormReturn } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Car } from 'lucide-react'

interface VehicleFormSectionProps {
  form: UseFormReturn<any>
}

export function VehicleFormSection({ form }: VehicleFormSectionProps) {
  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')

    if (value.length > 7) value = value.slice(0, 7)

    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3)
    }

    form.setValue('plate', value)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Car className="h-5 w-5 text-primary" />
        Dados do Veículo
      </h3>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 sm:col-span-6">
          <FormField
            control={form.control}
            name="car"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo Carro *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Honda Civic" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6 sm:col-span-3">
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="YYYY" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="col-span-6 sm:col-span-3">
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
                    onChange={handlePlateChange}
                    maxLength={8}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}
