import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/Header'
import useAppStore from '@/stores/useAppStore'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { ReportKPIs } from '@/components/reports/ReportKPIs'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { VehiclesChart } from '@/components/reports/VehiclesChart'
import { GeoChart } from '@/components/reports/GeoChart'
import { getYear, getMonth, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalesSummary } from '@/types'

export default function Relatorios() {
  const { sales, commissions, refreshSales } = useAppStore()
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  )
  const [selectedMonth, setSelectedMonth] = useState<string>('all') // 'all' or '0'-'11'

  useEffect(() => {
    refreshSales()
  }, [refreshSales])

  // Filter Logic
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleYear = getYear(sale.date)
      const saleMonth = getMonth(sale.date)

      const yearMatch = saleYear === selectedYear
      const monthMatch =
        selectedMonth === 'all' || saleMonth === parseInt(selectedMonth)

      return yearMatch && monthMatch
    })
  }, [sales, selectedYear, selectedMonth])

  const availableYears = useMemo(() => {
    const years = new Set(sales.map((s) => getYear(s.date)))
    years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [sales])

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalRevenue = filteredSales.reduce(
      (acc, s) => acc + (s.saleValue || 0),
      0,
    )
    const totalCommission = filteredSales.reduce(
      (acc, s) => acc + s.commission,
      0,
    )
    const totalSalesCount = filteredSales.length

    // Top Car
    const carCounts: Record<string, number> = {}
    filteredSales.forEach((s) => {
      carCounts[s.car] = (carCounts[s.car] || 0) + 1
    })
    const topCar = Object.entries(carCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

    return {
      totalRevenue,
      totalCommission,
      totalSalesCount,
      topCar,
    }
  }, [filteredSales])

  // Chart Data Preparation
  const revenueData = useMemo(() => {
    // If filtering by specific month, show daily breakdown? Or just weekly?
    // For simplicity, if "all" months, show monthly breakdown.
    // If specific month, we could show daily, but let's stick to monthly view for the whole year if "all" selected,
    // or filtering the specific month in context.
    // Actually, let's make the main chart always show the months of the selected year to show trends.

    const data: any[] = []
    const months = Array.from({ length: 12 }, (_, i) => i)

    months.forEach((m) => {
      const monthSales = sales.filter(
        (s) => getYear(s.date) === selectedYear && getMonth(s.date) === m,
      )
      const monthCommission = commissions.find(
        (c) => c.year === selectedYear && c.month === m,
      )

      const rev = monthSales.reduce((acc, s) => acc + (s.saleValue || 0), 0)
      const salesComm = monthSales.reduce((acc, s) => acc + s.commission, 0)
      const totalComm =
        salesComm +
        (monthCommission?.bonus || 0) +
        (monthCommission?.salary || 0) +
        (monthCommission?.extras || 0)

      data.push({
        name: format(new Date(selectedYear, m, 1), 'MMM', { locale: ptBR }),
        revenue: rev,
        commission: totalComm,
        rawMonth: m,
      })
    })

    // If a specific month is selected, we highlight it or just show it?
    // The requirement says "Comparativo". Visualizing the whole year is better for context.
    // But KPIs update based on filter.
    return data
  }, [sales, commissions, selectedYear])

  const vehiclesData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredSales.forEach((s) => {
      const name = s.car.split(' ')[0] + ' ' + (s.car.split(' ')[1] || '') // Simple model grouping
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredSales])

  const geoData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredSales.forEach((s) => {
      const city = s.clientDetails?.city || s.clientCity || 'Não Informado'
      counts[city] = (counts[city] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredSales])

  return (
    <div className="flex flex-col h-full bg-secondary/10">
      <Header title="Relatórios" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            Painel de Performance
          </h2>
          <p className="text-muted-foreground">
            Análise detalhada de vendas, comissões e distribuição.
          </p>
        </div>

        <ReportFilters
          year={selectedYear}
          setYear={setSelectedYear}
          month={selectedMonth}
          setMonth={setSelectedMonth}
          availableYears={availableYears}
          onRefresh={refreshSales}
        />

        <ReportKPIs {...kpis} />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="sales">Vendas & Veículos</TabsTrigger>
            <TabsTrigger value="geo">Geográfico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <RevenueChart data={revenueData} />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <VehiclesChart data={vehiclesData} />
              <Card className="card-shadow border-none">
                <CardHeader>
                  <CardTitle>Resumo de Vendas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vehiclesData
                      .sort((a, b) => b.value - a.value)
                      .slice(0, 5)
                      .map((v, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {i + 1}
                            </div>
                            <span className="font-medium">{v.name}</span>
                          </div>
                          <span className="font-bold">{v.value} un.</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geo" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1">
              <GeoChart data={geoData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
