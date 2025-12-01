import { useEffect, useMemo, useState } from 'react'
import useCrmStore from '@/stores/useCrmStore'
import useAppStore from '@/stores/useAppStore' // To get sales for 80-day logic
import { Header } from '@/components/Header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Calendar, CheckCircle2, Clock, Gift } from 'lucide-react'
import { format, addDays, isSameDay, subDays, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'

export default function CrmAlerts() {
  const { alerts, fetchAlerts, dismissAlert, clients, fetchClients } =
    useCrmStore()
  const { sales, refreshSales } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchAlerts(), fetchClients(), refreshSales()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchAlerts, fetchClients, refreshSales])

  // 1. Birthday Alerts (Next 30 days)
  const birthdayAlerts = useMemo(() => {
    const today = new Date()
    const next30Days = addDays(today, 30)

    return clients
      .filter((client) => {
        if (!client.birth_date) return false
        const birth = new Date(client.birth_date)
        // Check if birthday (month/day) is between today and next 30 days
        // Simplistic check: create date for current year and next year
        const currentYearBirthday = new Date(
          today.getFullYear(),
          birth.getUTCMonth(),
          birth.getUTCDate(),
        )
        const nextYearBirthday = new Date(
          today.getFullYear() + 1,
          birth.getUTCMonth(),
          birth.getUTCDate(),
        )

        return (
          (currentYearBirthday >= today && currentYearBirthday <= next30Days) ||
          (nextYearBirthday >= today && nextYearBirthday <= next30Days)
        )
      })
      .map((client) => ({
        id: `birthday-${client.id}`,
        type: 'Aniversário',
        client_name: client.full_name,
        client_id: client.id,
        date: client.birth_date, // Show actual birth date
        message: 'Aniversário se aproximando',
        icon: Gift,
        color: 'text-pink-500 bg-pink-100',
      }))
  }, [clients])

  // 2. Post-Sale Alerts (Exactly 80 days ago)
  const postSaleAlerts = useMemo(() => {
    const today = new Date()
    const eightyDaysAgo = subDays(today, 80)

    return sales
      .filter((sale) => {
        return isSameDay(sale.date, eightyDaysAgo)
      })
      .map((sale) => ({
        id: `sale-${sale.id}`,
        type: 'Pós-Venda',
        client_name: sale.client,
        client_id: sale.clientId || '',
        date: sale.date,
        message: `Venda realizada há 80 dias (${sale.car}). Hora do contato!`,
        icon: Clock,
        color: 'text-blue-500 bg-blue-100',
      }))
  }, [sales])

  // 3. Custom Alerts
  const customAlerts = alerts.map((alert) => ({
    id: alert.id,
    type: alert.alert_type,
    client_name: alert.client?.full_name || 'Cliente',
    client_id: alert.client_id,
    date: alert.alert_date,
    message: alert.message,
    icon: Bell,
    color: 'text-yellow-500 bg-yellow-100',
    isCustom: true,
  }))

  const allAlerts = [...customAlerts, ...postSaleAlerts, ...birthdayAlerts]

  return (
    <div className="flex flex-col h-full">
      <Header title="CRM - Alertas" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aniversários (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-500">
                {birthdayAlerts.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pós-Venda (Hoje)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {postSaleAlerts.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Alertas Ativos
          </h2>
          {allAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum alerta pendente para hoje.
            </div>
          ) : (
            <div className="grid gap-4">
              {allAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4"
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${alert.color}`}
                  >
                    <alert.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{alert.type}</h4>
                      <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                        {format(new Date(alert.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliente:{' '}
                      <Link
                        to={`/crm/clients/${alert.client_id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {alert.client_name}
                      </Link>
                    </p>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  {alert.isCustom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto shrink-0 text-muted-foreground hover:text-green-600"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
