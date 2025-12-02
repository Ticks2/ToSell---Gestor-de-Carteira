import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Car, Award } from 'lucide-react'

interface KPIProps {
  totalRevenue: number
  totalCommission: number
  totalSalesCount: number
  topCar: string
}

export function ReportKPIs({
  totalRevenue,
  totalCommission,
  totalSalesCount,
  topCar,
}: KPIProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="card-shadow border-none bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Faturamento Total
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalRevenue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valor total de vendas
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow border-none bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Comissões Totais
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalCommission.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Receita líquida gerada
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Veículos Vendidos
          </CardTitle>
          <Car className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSalesCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Volume de vendas no período
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Modelo Mais Vendido
          </CardTitle>
          <Award className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate" title={topCar}>
            {topCar || '-'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Top performance</p>
        </CardContent>
      </Card>
    </div>
  )
}
