import { useEffect, useState, useMemo } from 'react'
import { Header } from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Target, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { salesService } from '@/services/salesService'
import { formatCurrency } from '@/lib/utils'
import { startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuth()
  const [totalSales, setTotalSales] = useState(0)
  const [totalCommission, setTotalCommission] = useState(0)
  const [averageCommission, setAverageCommission] = useState(0)

  const [totalAnnualCommissions, setTotalAnnualCommissions] = useState(0)
  const [totalMonthlyEarnings, setTotalMonthlyEarnings] = useState(0)
  const [monthlyGoal, setMonthlyGoal] = useState(5000)
  const [progress, setProgress] = useState(0)

  const selectedDate = useMemo(() => new Date(), [])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return

      try {
        const sales = await salesService.getSales(user.id)

        const totalVal = sales.reduce(
          (acc: number, curr: any) => acc + (curr.commission || 0),
          0,
        )
        const count = sales.length

        setTotalCommission(totalVal)
        setTotalSales(count)
        setAverageCommission(count > 0 ? totalVal / count : 0)

        const startYear = startOfYear(selectedDate)
        const endYear = endOfYear(selectedDate)
        const annualSales = sales.filter((s: any) => {
          const d = new Date(s.date)
          return d >= startYear && d <= endYear
        })
        const annualTotal = annualSales.reduce(
          (acc: number, s: any) => acc + (s.commission || 0),
          0,
        )
        setTotalAnnualCommissions(annualTotal)

        const startMonth = startOfMonth(selectedDate)
        const endMonth = endOfMonth(selectedDate)
        const monthlySales = sales.filter((s: any) => {
          const d = new Date(s.date)
          return d >= startMonth && d <= endMonth
        })
        const monthlyTotal = monthlySales.reduce(
          (acc: number, s: any) => acc + (s.commission || 0),
          0,
        )
        setTotalMonthlyEarnings(monthlyTotal)

        const goal = 10000
        setMonthlyGoal(goal)
        setProgress(Math.min((monthlyTotal / goal) * 100, 100))
      } catch (error) {
        console.error('Error loading dashboard data', error)
      }
    }

    loadDashboardData()
  }, [user, selectedDate])

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Acumulado
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalCommission)}
                </div>
                <p className="text-xs text-muted-foreground">
                  em comissões totais
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Operações
                </CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  vendas registradas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ticket Médio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(averageCommission)}
                </div>
                <p className="text-xs text-muted-foreground">
                  comissão por venda
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
                  {totalAnnualCommissions.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
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
                    maximumFractionDigits: 2,
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
        </div>
      </div>
    </div>
  )
}
