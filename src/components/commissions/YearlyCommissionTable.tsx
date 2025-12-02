import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency, cn } from '@/lib/utils'
import { YearlyCommissionData } from '@/types/commissions'

interface YearlyCommissionTableProps {
  selectedYear: number
  yearlyData: YearlyCommissionData[]
}

export function YearlyCommissionTable({
  selectedYear,
  yearlyData,
}: YearlyCommissionTableProps) {
  const getMonthName = (m: number) => {
    return new Date(2000, m - 1, 1).toLocaleString('pt-BR', { month: 'long' })
  }

  return (
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
  )
}
