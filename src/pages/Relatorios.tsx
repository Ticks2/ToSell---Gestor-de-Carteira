import { useState } from 'react'
import { Header } from '@/components/Header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import useAppStore from '@/stores/useAppStore'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

export default function Relatorios() {
  const { sales } = useAppStore()
  const [activeTab, setActiveTab] = useState('anual')

  // Mock Data preparations
  const vehicleData = [
    { name: 'Honda Civic', value: 12 },
    { name: 'Toyota Corolla', value: 8 },
    { name: 'Jeep Compass', value: 6 },
    { name: 'Fiat Uno', value: 4 },
    { name: 'Outros', value: 10 },
  ]

  const colors = ['#007AFF', '#AF52DE', '#34C759', '#FF9500', '#FF2D55']

  return (
    <div className="flex flex-col h-full">
      <Header title="Relatórios" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <Tabs
          defaultValue="anual"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="anual">Anual</TabsTrigger>
              <TabsTrigger value="veiculo">Por Veículo</TabsTrigger>
              <TabsTrigger value="cliente">Por Cliente</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          </div>

          <TabsContent value="anual" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="card-shadow border-none">
                <CardHeader>
                  <CardTitle>Desempenho Anual</CardTitle>
                  <CardDescription>
                    Volume de vendas comparado mês a mês
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sales.slice(0, 12).map((s, i) => ({
                        name: `Mês ${i + 1}`,
                        total: Math.floor(Math.random() * 10000),
                      }))}
                    >
                      <XAxis
                        dataKey="name"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <RechartsTooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Bar
                        dataKey="total"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="veiculo" className="space-y-4">
            <Card className="card-shadow border-none max-w-3xl">
              <CardHeader>
                <CardTitle>Distribuição por Modelo</CardTitle>
                <CardDescription>Veículos mais negociados</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                <ChartContainer config={{}} className="h-full w-full">
                  <PieChart>
                    <Pie
                      data={vehicleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {vehicleData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="ml-8 space-y-2">
                  {vehicleData.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <span className="font-medium">{entry.name}</span>
                      <span className="text-muted-foreground">
                        ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cliente">
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground bg-white rounded-lg border border-dashed">
              <p>Selecione um cliente para gerar o relatório detalhado.</p>
              <Button variant="link" className="mt-2">
                Buscar Cliente
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
