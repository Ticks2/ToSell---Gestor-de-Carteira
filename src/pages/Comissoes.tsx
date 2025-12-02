import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { salesService } from '@/services/salesService'
import { commissionsService } from '@/services/commissionsService'
import { Sale, MonthlyCommission } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import useAppStore from '@/stores/useAppStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Save, TrendingUp, DollarSign, Briefcase } from 'lucide-react'

export default function Comissoes() {
  const { selectedMonth, selectedYear, viewMode } = useAppStore()
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [salary, setSalary] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [yearlyData, setYearlyData] = useState<
    { month: number; total: number; sales: number; salary: number }[]
  >([])

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedYear, viewMode])

  const loadData = async () => {
    setLoading(true)
    try {
      if (viewMode === 'monthly') {
        // Load Sales
        const salesData = await salesService.getSales({
          month: selectedMonth,
          year: selectedYear,
        })
        setSales(salesData)

        // Load Commission Data (Salary)
        const commissionData = await commissionsService.getMonthlyCommission(
          selectedMonth,
          selectedYear,
        )

        // Future Date Check logic for Default 0
        if (commissionData && commissionData.salary !== null) {
          setSalary(commissionData.salary)
        } else {
          const now = new Date()
          const currentDate = new Date(now.getFullYear(), now.getMonth(), 1)
          const targetDate = new Date(selectedYear, selectedMonth - 1, 1)

          if (targetDate >= currentDate) {
            setSalary(0)
          } else {
            // For past dates without data, we can default to 0 or keep empty/null.
            // Requirement specifies future dates default to 0.
            setSalary(0)
          }
        }
      } else {
        // Yearly View Logic
        const salesData = await salesService.getSales({ year: selectedYear })
        const commissionsData =
          await commissionsService.getYearlyCommissions(selectedYear)

        // Aggregate by month
        const aggregated = Array.from({ length: 12 }, (_, i) => {
          const month = i + 1
          const monthSales = salesData.filter(
            (s) => new Date(s.data_venda).getMonth() + 1 === month,
          )
          const monthCommission = commissionsData.find((c) => c.month === month)

          const salesTotal = monthSales.reduce(
            (acc, curr) => acc + curr.valor_comissao,
            0,
          )
          const salaryTotal = monthCommission?.salary || 0
          return {
            month,
            sales: salesTotal,
            salary: salaryTotal,
            total: salesTotal + salaryTotal,
          }
        })
        setYearlyData(aggregated)
        setSales(salesData) // Keep sales loaded for possible usage
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as comissões.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSalary = async () => {
    try {
      await commissionsService.upsertMonthlyCommission({
        month: selectedMonth,
        year: selectedYear,
        salary: salary,
      })
      toast({
        title: 'Salário atualizado',
        description: 'O salário fixo foi salvo com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o salário.',
      })
    }
  }

  // Calculations
  const salesCommissionTotal = sales.reduce(
    (acc, curr) => acc + curr.valor_comissao,
    0,
  )
  // In monthly view, total is sales + salary. In yearly, it's sum of aggregated totals
  const totalIncome =
    viewMode === 'monthly'
      ? salesCommissionTotal + salary
      : yearlyData.reduce((acc, curr) => acc + curr.total, 0)

  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestão de Comissões
          </h1>
          <p className="text-muted-foreground">
            {viewMode === 'monthly'
              ? 'Gerencie seus ganhos e salário fixo mensal'
              : 'Visão geral anual de rendimentos'}
          </p>
        </div>
        <MonthYearPicker />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comissão de Vendas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                viewMode === 'monthly'
                  ? salesCommissionTotal
                  : yearlyData.reduce((acc, curr) => acc + curr.sales, 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {viewMode === 'monthly'
                ? `${sales.filter((s) => s.valor_comissao > 0).length} vendas comissionadas`
                : 'Total acumulado no ano'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salário Fixo</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                viewMode === 'monthly'
                  ? salary
                  : yearlyData.reduce((acc, curr) => acc + curr.salary, 0),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {viewMode === 'monthly'
                ? 'Valor base definido'
                : 'Soma dos salários mensais'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">
              Renda Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary-foreground/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-primary-foreground/80">
              {viewMode === 'monthly'
                ? 'Vendas + Salário Fixo'
                : 'Renda total anual'}
            </p>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'monthly' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column: Salary Config */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Configuração Financeira</CardTitle>
                <CardDescription>
                  Defina seu salário fixo para este mês.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Salário Fixo</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-2.5 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="salary"
                        type="number"
                        placeholder="0,00"
                        className="pl-8"
                        value={salary || ''}
                        onChange={(e) => setSalary(Number(e.target.value))}
                      />
                    </div>
                    <Button size="icon" onClick={handleSaveSalary}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Para meses futuros, o valor inicia como R$ 0,00.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Sales List */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Comissões</CardTitle>
                <CardDescription>
                  Vendas que geraram comissão no período.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sales.filter((s) => s.valor_comissao > 0).length > 0 ? (
                    sales
                      .filter((s) => s.valor_comissao > 0)
                      .map((sale) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div>
                            <p className="font-medium">{sale.carro}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sale.data_venda).toLocaleDateString(
                                'pt-BR',
                              )}{' '}
                              - {sale.nome_cliente}
                            </p>
                          </div>
                          <div className="font-bold text-green-600">
                            {formatCurrency(sale.valor_comissao)}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <p>Nenhuma comissão registrada neste mês.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {viewMode === 'yearly' && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Anual</CardTitle>
            <CardDescription>
              Desempenho financeiro mês a mês em {selectedYear}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Mês
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Comissão Vendas
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Salário Fixo
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {yearlyData.map((row) => (
                    <tr
                      key={row.month}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
                        row.total > 0 ? '' : 'text-muted-foreground/50',
                      )}
                    >
                      <td className="p-4 align-middle font-medium capitalize">
                        {getMonthName(row.month)}
                      </td>
                      <td className="p-4 text-right align-middle">
                        {formatCurrency(row.sales)}
                      </td>
                      <td className="p-4 text-right align-middle">
                        {formatCurrency(row.salary)}
                      </td>
                      <td className="p-4 text-right align-middle font-bold text-foreground">
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
