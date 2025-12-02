import { UseFormReturn } from 'react-hook-form'
import { Client } from '@/types'
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
import { Button } from '@/components/ui/button'
import { UserPlus, Search, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'

interface ClientFormSectionProps {
  form: UseFormReturn<any>
  clients: Client[]
  isNewClient: boolean
  setIsNewClient: (value: boolean) => void
}

export function ClientFormSection({
  form,
  clients,
  isNewClient,
  setIsNewClient,
}: ClientFormSectionProps) {
  const selectedClientId = form.watch('clientId')
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Dados do Cliente
        </h3>
        <div className="flex bg-muted p-1 rounded-md">
          <Button
            type="button"
            variant={!isNewClient ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsNewClient(false)}
          >
            <Search className="mr-2 h-3 w-3" /> Buscar
          </Button>
          <Button
            type="button"
            variant={isNewClient ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setIsNewClient(true)
              form.setValue('clientId', '')
            }}
          >
            <UserPlus className="mr-2 h-3 w-3" /> Novo
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {!isNewClient ? (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecionar Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente..." />
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

            {selectedClient && (
              <Card className="bg-secondary/20 border-dashed">
                <CardContent className="pt-6 space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground col-span-1">
                      Email:
                    </span>
                    <span className="col-span-2 truncate">
                      {selectedClient.email || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground col-span-1">
                      Telefone:
                    </span>
                    <span className="col-span-2">
                      {selectedClient.phone || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground col-span-1">
                      Cidade:
                    </span>
                    <span className="col-span-2">
                      {selectedClient.city || '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-medium text-muted-foreground col-span-1">
                      Nasc.:
                    </span>
                    <span className="col-span-2">
                      {selectedClient.birth_date
                        ? format(
                            new Date(selectedClient.birth_date),
                            'dd/MM/yyyy',
                          )
                        : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
            <FormField
              control={form.control}
              name="newClientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
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
              <FormField
                control={form.control}
                name="newClientBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="newClientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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

            <FormField
              control={form.control}
              name="newClientCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
}
