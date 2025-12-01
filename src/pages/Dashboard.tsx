import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react'
import { XAxis, YAxis, AreaChart, Area } from 'recharts'
import useAppStore from '@/stores/useAppStore'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/Header'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { selectedDate, setSelectedDate, getMonthlyData, sales, monthlyGoal } =
    useAppStore()

  const { sales: monthlySales, commissionData } = useMemo(
    () => getMonthlyData(selectedDate),
    [selectedDate, getMonthlyData],
  )

  const totalSalesCommission = monthlySales.reduce(
    (acc, curr) => acc + curr.commission,
    0,
  )

  // Total Monthly Earnings (Sales Commission + All Bonuses/Extras)
  const totalMonthlyEarnings =
    totalSalesCommission +
    (commissionData.bonus || 0) +
    (commissionData.returns || 0) +
    (commissionData.transfers || 0) +
    (commissionData.surplus || 0) +
    (commissionData.extras || 0) +
    (commissionData.salary || 1991)

  const totalCommissionsYear = sales
    .filter((s) => s.date.getFullYear() === selectedDate.getFullYear())
    .reduce((acc, curr) => acc + curr.commission, 0)

  const chartData = useMemo(() => {
    const data = []
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(selectedDate.getFullYear(), i, 1)
      const monthSales = sales.filter(
        (s) =>
          s.date.getMonth() === i &&
          s.date.getFullYear() === selectedDate.getFullYear(),
      )
      const total = monthSales.reduce((acc, curr) => acc + curr.commission, 0)
      data.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        comissao: total,
      })
    }
    return data
  }, [sales, selectedDate])

  const progress = Math.min(
    (totalMonthlyEarnings / (monthlyGoal || 5000)) * 100,
    100,
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
          <MonthYearPicker date={selectedDate} onChange={setSelectedDate} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-shadow border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendas Mês Atual
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlySales.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total operações (Vendas + Compras)
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Comissões (Ano)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${' '}
                {totalCommissionsYear.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Acumulado em {selectedDate.getFullYear()}
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Mensal
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${' '}
                {totalMonthlyEarnings.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Inclui fixo e bônus
              </p>
            </CardContent>
          </Card>

          <Card className="card-shadow border-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meta Mensal
              </CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
              <div className="h-2 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meta: R$ {(monthlyGoal || 5000).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-4 card-shadow border-none">
            <CardHeader>
              <CardTitle>Evolução de Comissões</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ChartContainer
                config={{
                  comissao: {
                    label: 'Comissão',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-[300px] w-full"
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="fillComissao"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-comissao)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-comissao)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    type="natural"
                    dataKey="comissao"
                    stroke="var(--color-comissao)"
                    fill="url(#fillComissao)"
                    fillOpacity={0.4}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3 card-shadow border-none">
            <CardHeader>
              <CardTitle>Últimas Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlySales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-medium',
                        sale.type === 'Venda'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-blue-100 text-blue-700 border-blue-200',
                      )}
                    >
                      {sale.type === 'Venda' ? 'V' : 'C'}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {sale.car}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sale.client}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-sm">
                      +R$ {sale.commission}
                    </div>
                  </div>
                ))}
                {monthlySales.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma venda registrada.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
