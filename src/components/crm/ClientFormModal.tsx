import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Client } from '@/types'
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
import { useEffect } from 'react'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/use-toast'

const clientSchema = z.object({
  full_name: z.string().min(2, 'Nome é obrigatório'),
  birth_date: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  status: z.enum(['client', 'lead']).default('client'),
})

interface ClientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Client
  onSuccess: () => void
}

export function ClientFormModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: ClientFormModalProps) {
  const { toast } = useToast()

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: '',
      birth_date: '',
      city: '',
      phone: '',
      email: '',
      status: 'client',
    },
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          full_name: initialData.full_name,
          birth_date: initialData.birth_date || '',
          city: initialData.city || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          status: initialData.status,
        })
      } else {
        form.reset({
          full_name: '',
          birth_date: '',
          city: '',
          phone: '',
          email: '',
          status: 'client',
        })
      }
    }
  }, [open, initialData, form])

  const onSubmit = async (values: z.infer<typeof clientSchema>) => {
    try {
      if (initialData) {
        await clientService.updateClient(initialData.id, {
          full_name: values.full_name,
          birth_date: values.birth_date || null,
          city: values.city || null,
          phone: values.phone || null,
          email: values.email || null,
          status: values.status,
        })
        toast({ title: 'Cliente atualizado com sucesso!' })
      } else {
        // For creation, we don't have a direct method exposed in the service file provided in context,
        // but `createClient` is in `clientService`.
        await clientService.createClient({
          full_name: values.full_name,
          birth_date: values.birth_date || null,
          city: values.city || null,
          phone: values.phone || null,
          email: values.email || null,
          status: values.status,
        })
        toast({ title: 'Cliente criado com sucesso!' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast({ title: 'Erro ao salvar cliente', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="birth_date"
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
                name="phone"
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
            <FormField
              control={form.control}
              name="email"
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
            <FormField
              control={form.control}
              name="city"
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
