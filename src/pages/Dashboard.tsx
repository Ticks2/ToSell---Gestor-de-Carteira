import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { salesService } from '@/services/salesService'
import { Sale } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllSales = async () => {
      try {
        const data = await salesService.getSales()
        setSales(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllSales()
  }, [])

  // Aggregations
  const totalSales = sales.length
  const totalCommission = sales.reduce(
    (acc, curr) => acc + (curr.valor_comissao || 0),
    0,
  )
  const averageCommission = totalSales > 0 ? totalCommission / totalSales : 0

  // Chart Data Preparation
  const salesByMonth = sales.reduce(
    (acc, curr) => {
      const date = new Date(curr.data_venda)
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`
      if (!acc[key]) acc[key] = { name: key, vendas: 0, comissao: 0 }
      acc[key].vendas += 1
      acc[key].comissao += curr.valor_comissao
      return acc
    },
    {} as Record<string, any>,
  )

  const chartData = Object.values(salesByMonth).sort((a: any, b: any) => {
    const [mA, yA] = a.name.split('/').map(Number)
    const [mB, yB] = b.name.split('/').map(Number)
    return new Date(yA, mA).getTime() - new Date(yB, mB).getTime()
  })

  const typeDistribution = sales.reduce(
    (acc, curr) => {
      const type = curr.tipo_operacao || 'Venda'
      if (!acc[type]) acc[type] = 0
      acc[type] += 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({
    name,
    value,
  }))
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
  ]

  const chartConfig = {
    vendas: {
      label: 'Vendas',
      color: 'hsl(var(--chart-1))',
    },
    comissao: {
      label: 'Comissão',
      color: 'hsl(var(--chart-2))',
    },
    Venda: {
      label: 'Venda',
      color: 'hsl(var(--chart-1))',
    },
    Compra: {
      label: 'Compra',
      color: 'hsl(var(--chart-2))',
    },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Acumulado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">em comissões totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Operações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">vendas registradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageCommission)}
            </div>
            <p className="text-xs text-muted-foreground">comissão por venda</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Comissões por Mês</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `R$${val}`}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="comissao"
                  fill="var(--color-comissao)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Tipo de Operação</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
