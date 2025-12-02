import { useEffect, useMemo, useState } from 'react'
import useCrmStore from '@/stores/useCrmStore'
import { Header } from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bell,
  CheckCircle2,
  Clock,
  Gift,
  Check,
  Filter,
  X,
  CalendarIcon,
} from 'lucide-react'
import {
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DateRange } from 'react-day-picker'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function CrmAlerts() {
  const { alerts, fetchAlerts, dismissAlert, checkAndGenerateAlerts } =
    useCrmStore()
  const [isLoading, setIsLoading] = useState(true)

  // Filter States
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'dismissed'
  >('active')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await checkAndGenerateAlerts() // This syncs and then fetches all
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

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // Filter by Status
      if (statusFilter === 'active' && alert.is_dismissed) return false
      if (statusFilter === 'dismissed' && !alert.is_dismissed) return false

      // Filter by Type
      if (typeFilter !== 'all' && alert.alert_type !== typeFilter) return false

      // Filter by Date Range
      if (dateRange?.from) {
        const alertDate = parseISO(alert.alert_date)
        const start = startOfDay(dateRange.from)
        const end = dateRange.to
          ? endOfDay(dateRange.to)
          : endOfDay(dateRange.from)

        if (!isWithinInterval(alertDate, { start, end })) return false
      }

      return true
    })
  }, [alerts, statusFilter, typeFilter, dateRange])

  // Summary stats based on ALL active alerts (ignoring other filters for the summary cards usually, but requirement unclear, sticking to active state for cards)
  const activeAlerts = alerts.filter((a) => !a.is_dismissed)
  const birthdayAlerts = activeAlerts.filter((a) => a.alert_type === 'birthday')
  const postSaleAlerts = activeAlerts.filter(
    (a) => a.alert_type === 'post-sale',
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="CRM - Alertas" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aniversários (Ativos)
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
                Pós-Venda (Ativos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {postSaleAlerts.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(v: any) => setStatusFilter(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Não Vistos (Ativos)</SelectItem>
                <SelectItem value="dismissed">Vistos (Histórico)</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Alerta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="birthday">Aniversários</SelectItem>
                <SelectItem value="post-sale">Pós-Venda</SelectItem>
                <SelectItem value="custom">Personalizados</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/y')} -{' '}
                        {format(dateRange.to, 'dd/MM/y')}
                      </>
                    ) : (
                      format(dateRange.from, 'dd/MM/y')
                    )
                  ) : (
                    <span>Data do Alerta</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          {(statusFilter !== 'active' || typeFilter !== 'all' || dateRange) && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter('active')
                setTypeFilter('all')
                setDateRange(undefined)
              }}
              className="h-10 px-2 lg:px-3"
            >
              Limpar
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Lista de Alertas
          </h2>
          {isLoading ? (
            <div className="text-center py-8">Carregando alertas...</div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhum alerta encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAlerts.map((alert) => {
                const Icon = getAlertIcon(alert.alert_type)
                const isDismissed = alert.is_dismissed
                return (
                  <Card
                    key={alert.id}
                    className={cn(
                      'flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4',
                      isDismissed && 'opacity-60 bg-muted/30',
                    )}
                  >
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isDismissed ? 'bg-gray-200 text-gray-500' : getAlertColor(alert.alert_type)}`}
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
                        {isDismissed && (
                          <Badge variant="outline" className="text-xs">
                            Visto
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground border px-2 py-0.5 rounded-full">
                          {format(parseISO(alert.alert_date), 'dd/MM/yyyy')}
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
                    {!isDismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto shrink-0 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como visto
                      </Button>
                    )}
                    {isDismissed && (
                      <div className="ml-auto shrink-0 text-sm text-muted-foreground flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                        Concluído
                      </div>
                    )}
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
