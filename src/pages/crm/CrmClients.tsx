import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useCrmStore from '@/stores/useCrmStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Header } from '@/components/Header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, User, Edit2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ClientFormModal } from '@/components/crm/ClientFormModal'
import { Client } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'

export default function CrmClients() {
  const { clients, leads, fetchClients, deleteClient, isLoading } =
    useCrmStore()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('clients')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | undefined>(
    undefined,
  )
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const filterList = (list: any[]) => {
    return list.filter(
      (item) =>
        item.full_name.toLowerCase().includes(search.toLowerCase()) ||
        item.email?.toLowerCase().includes(search.toLowerCase()),
    )
  }

  const filteredClients = filterList(clients)
  const filteredLeads = filterList(leads)

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingClient(undefined)
    setIsModalOpen(true)
  }

  const handleSuccess = () => {
    fetchClients()
  }

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client)
  }

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete.id)
      toast({
        title: 'Cliente removido',
        description:
          'O cliente e todos os seus dados foram removidos com sucesso.',
      })
      setClientToDelete(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="CRM - Clientes & Leads" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="clients">
                Clientes ({clients.length})
              </TabsTrigger>
              <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(activeTab === 'clients' ? filteredClients : filteredLeads).map(
                (client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <Link
                          to={`/crm/clients/${client.id}`}
                          className="hover:underline text-primary font-medium"
                        >
                          {client.full_name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.city || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          client.status === 'client' ? 'default' : 'secondary'
                        }
                      >
                        {client.status === 'client' ? 'Cliente' : 'Lead'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                (activeTab === 'clients' ? filteredClients : filteredLeads)
                  .length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ClientFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        initialData={editingClient}
        onSuccess={handleSuccess}
      />

      <AlertDialog
        open={!!clientToDelete}
        onOpenChange={(open) => !open && setClientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              cliente{' '}
              <span className="font-semibold text-foreground">
                {clientToDelete?.full_name}
              </span>{' '}
              e todos os dados associados (vendas, interações, alertas).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Cliente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
