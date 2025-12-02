import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Briefcase, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CommissionSummaryCardsProps {
  viewMode: 'monthly' | 'yearly'
  salesCommissionTotal: number
  salary: number
  yearlySalesTotal: number
  yearlySalaryTotal: number
  totalIncome: number
  salesCount: number
}

export function CommissionSummaryCards({
  viewMode,
  salesCommissionTotal,
  salary,
  yearlySalesTotal,
  yearlySalaryTotal,
  totalIncome,
  salesCount,
}: CommissionSummaryCardsProps) {
  const displaySales =
    viewMode === 'monthly' ? salesCommissionTotal : yearlySalesTotal
  const displaySalary = viewMode === 'monthly' ? salary : yearlySalaryTotal

  return (
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
            {formatCurrency(displaySales)}
          </div>
          <p className="text-xs text-muted-foreground">
            {viewMode === 'monthly'
              ? `${salesCount} vendas comissionadas`
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
            {formatCurrency(displaySalary)}
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
  )
}
