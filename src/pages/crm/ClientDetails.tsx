import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useCrmStore from '@/stores/useCrmStore'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Bell,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>()
  const {
    currentClient,
    clientSales,
    interactions,
    fetchClientDetails,
    addInteraction,
    setClientStatus,
    createAlert,
  } = useCrmStore()
  const { toast } = useToast()

  const [isInteractionOpen, setIsInteractionOpen] = useState(false)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  // Interaction Form State
  const [newInteraction, setNewInteraction] = useState({
    type: 'Call',
    notes: '',
    nextDate: '',
    status: 'Contacted',
  })

  // Alert Form State
  const [newAlert, setNewAlert] = useState({
    date: '',
    message: '',
  })

  useEffect(() => {
    if (id) {
      fetchClientDetails(id)
    }
  }, [id, fetchClientDetails])

  const handleAddInteraction = async () => {
    if (!id || !newInteraction.notes) return
    try {
      await addInteraction({
        client_id: id,
        interaction_type: newInteraction.type,
        notes: newInteraction.notes,
        next_contact_date: newInteraction.nextDate || null,
        status: newInteraction.status,
        interaction_date: new Date().toISOString(),
      })
      setIsInteractionOpen(false)
      setNewInteraction({
        type: 'Call',
        notes: '',
        nextDate: '',
        status: 'Contacted',
      })
      toast({ title: 'Interação registrada!' })
      fetchClientDetails(id) // Refresh list
    } catch (error) {
      toast({ title: 'Erro ao registrar', variant: 'destructive' })
    }
  }

  const handleCreateAlert = async () => {
    if (!id || !newAlert.date || !newAlert.message) return
    try {
      await createAlert({
        client_id: id,
        alert_type: 'custom',
        alert_date: newAlert.date,
        message: newAlert.message,
      })
      setIsAlertOpen(false)
      setNewAlert({ date: '', message: '' })
      toast({ title: 'Alerta criado!' })
    } catch (error) {
      toast({ title: 'Erro ao criar alerta', variant: 'destructive' })
    }
  }

  const toggleStatus = async () => {
    if (!currentClient) return
    const newStatus = currentClient.status === 'lead' ? 'client' : 'lead'
    try {
      await setClientStatus(currentClient.id, newStatus)
      toast({
        title: `Status alterado para ${newStatus === 'client' ? 'Cliente' : 'Lead'}`,
      })
    } catch (error) {
      toast({ title: 'Erro ao alterar status', variant: 'destructive' })
    }
  }

  if (!currentClient) return <div className="p-8">Carregando...</div>

  return (
    <div className="flex flex-col h-full">
      <Header title="Perfil do Cliente" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/crm/clients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {currentClient.full_name}
            </h2>
            <p className="text-sm text-muted-foreground">
              ID: {currentClient.id}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant={
                currentClient.status === 'lead' ? 'secondary' : 'default'
              }
              onClick={toggleStatus}
            >
              {currentClient.status === 'lead'
                ? 'Converter em Cliente'
                : 'Voltar para Lead'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar: Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {currentClient.email || 'Sem email'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {currentClient.phone || 'Sem telefone'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {currentClient.city || 'Cidade não informada'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {currentClient.birth_date
                      ? format(new Date(currentClient.birth_date), 'dd/MM/yyyy')
                      : 'Data de nasc. não informada'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status Atual</span>
                  <Badge
                    variant={
                      currentClient.status === 'client'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {currentClient.status.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Dialog
                  open={isInteractionOpen}
                  onOpenChange={setIsInteractionOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Nova Interação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Interação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={newInteraction.type}
                            onValueChange={(v) =>
                              setNewInteraction({ ...newInteraction, type: v })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Call">Telefone</SelectItem>
                              <SelectItem value="Email">Email</SelectItem>
                              <SelectItem value="Meeting">Reunião</SelectItem>
                              <SelectItem value="Whatsapp">Whatsapp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status Resultante</Label>
                          <Select
                            value={newInteraction.status}
                            onValueChange={(v) =>
                              setNewInteraction({
                                ...newInteraction,
                                status: v,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New Lead">
                                Novo Lead
                              </SelectItem>
                              <SelectItem value="Contacted">
                                Contatado
                              </SelectItem>
                              <SelectItem value="Follow-up Scheduled">
                                Follow-up
                              </SelectItem>
                              <SelectItem value="Opportunity">
                                Oportunidade
                              </SelectItem>
                              <SelectItem value="Closed Won">
                                Fechado (Ganho)
                              </SelectItem>
                              <SelectItem value="Closed Lost">
                                Perdido
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notas</Label>
                        <Textarea
                          placeholder="Descreva a interação..."
                          value={newInteraction.notes}
                          onChange={(e) =>
                            setNewInteraction({
                              ...newInteraction,
                              notes: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Próximo Contato (Opcional)</Label>
                        <Input
                          type="date"
                          value={newInteraction.nextDate}
                          onChange={(e) =>
                            setNewInteraction({
                              ...newInteraction,
                              nextDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button onClick={handleAddInteraction} className="w-full">
                        Salvar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Bell className="mr-2 h-4 w-4" /> Criar Alerta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Alerta Personalizado</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Data do Alerta</Label>
                        <Input
                          type="date"
                          value={newAlert.date}
                          onChange={(e) =>
                            setNewAlert({ ...newAlert, date: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mensagem</Label>
                        <Input
                          placeholder="Ex: Ligar para oferecer seguro"
                          value={newAlert.message}
                          onChange={(e) =>
                            setNewAlert({
                              ...newAlert,
                              message: e.target.value,
                            })
                          }
                        />
                      </div>
                      <Button onClick={handleCreateAlert} className="w-full">
                        Criar Alerta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Right Content: Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="history">Histórico de Vendas</TabsTrigger>
                <TabsTrigger value="interactions">
                  Interações & Notas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Vendas Realizadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientSales.length > 0 ? (
                      <div className="space-y-4">
                        {clientSales.map((sale) => (
                          <div
                            key={sale.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div>
                              <p className="font-semibold">
                                {sale.car}{' '}
                                <span className="text-muted-foreground font-normal">
                                  ({sale.year})
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {sale.plate || 'S/ Placa'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {sale.saleValue
                                  ? sale.saleValue.toLocaleString('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    })
                                  : '-'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(sale.date, 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        Nenhuma venda registrada para este cliente.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interactions" className="mt-4">
                <Card className="h-[500px] flex flex-col">
                  <CardHeader>
                    <CardTitle>Linha do Tempo</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-6">
                      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {interactions.length > 0 ? (
                          interactions.map((interaction) => (
                            <div
                              key={interaction.id}
                              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                            >
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                {interaction.interaction_type === 'Call' && (
                                  <Phone className="w-5 h-5" />
                                )}
                                {interaction.interaction_type === 'Email' && (
                                  <Mail className="w-5 h-5" />
                                )}
                                {interaction.interaction_type === 'Meeting' && (
                                  <Users className="w-5 h-5" />
                                )}
                                {!['Call', 'Email', 'Meeting'].includes(
                                  interaction.interaction_type,
                                ) && <Bell className="w-5 h-5" />}
                              </div>

                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card p-4 rounded border shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-bold text-gray-900 dark:text-gray-100">
                                    {interaction.interaction_type}
                                  </div>
                                  <time className="font-mono text-xs text-gray-500">
                                    {format(
                                      new Date(interaction.interaction_date),
                                      'd MMM yyyy, HH:mm',
                                      { locale: ptBR },
                                    )}
                                  </time>
                                </div>
                                <div className="text-gray-700 dark:text-gray-300 mb-2 text-sm">
                                  {interaction.notes}
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Badge variant="outline">
                                    {interaction.status}
                                  </Badge>
                                  {interaction.next_contact_date && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Próx:{' '}
                                      {format(
                                        new Date(interaction.next_contact_date),
                                        'dd/MM',
                                      )}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            Nenhuma interação registrada. Comece agora!
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
