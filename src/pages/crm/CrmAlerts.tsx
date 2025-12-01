import { useEffect, useMemo, useState } from 'react'
import useCrmStore from '@/stores/useCrmStore'
import { Header } from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle2, Clock, Gift, Check } from 'lucide-react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

export default function CrmAlerts() {
  const { alerts, fetchAlerts, dismissAlert, checkAndGenerateAlerts } =
    useCrmStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await checkAndGenerateAlerts() // This syncs and then fetches
      setIsLoading(false)
    }
    loadData()
  }, [checkAndGenerateAlerts])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'birthday':
        return Gift
      case 'post-sale':
        return Clock
      default:
        return Bell
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'birthday':
        return 'text-pink-500 bg-pink-100'
      case 'post-sale':
        return 'text-blue-500 bg-blue-100'
      default:
        return 'text-yellow-500 bg-yellow-100'
    }
  }

  const birthdayAlerts = alerts.filter((a) => a.alert_type === 'birthday')
  const postSaleAlerts = alerts.filter((a) => a.alert_type === 'post-sale')
  const customAlerts = alerts.filter((a) => a.alert_type === 'custom')

  return (
    <div className="flex flex-col h-full">
      <Header title="CRM - Alertas" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aniversários
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
                Pós-Venda
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
            Alertas Pendentes
          </h2>
          {isLoading ? (
            <div className="text-center py-8">Carregando alertas...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum alerta pendente.
            </div>
          ) : (
            <div className="grid gap-4">
              {alerts.map((alert) => {
                const Icon = getAlertIcon(alert.alert_type)
                return (
                  <Card
                    key={alert.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4"
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getAlertColor(alert.alert_type)}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold capitalize">
                          {alert.alert_type === 'post-sale'
                            ? 'Pós-Venda'
                            : alert.alert_type === 'birthday'
                              ? 'Aniversário'
                              : 'Personalizado'}
                        </h4>
                        <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                          {format(new Date(alert.alert_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cliente:{' '}
                        <Link
                          to={`/crm/clients/${alert.client_id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {alert.client?.full_name || 'Cliente'}
                        </Link>
                      </p>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto shrink-0 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar como visto
                    </Button>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
