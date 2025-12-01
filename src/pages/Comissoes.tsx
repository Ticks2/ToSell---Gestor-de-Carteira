import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { salesService } from '@/services/salesService'
import { Sale } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import useAppStore from '@/stores/useAppStore'

export default function Comissoes() {
  const { selectedMonth, selectedYear } = useAppStore()
  const [sales, setSales] = useState<Sale[]>([])

  useEffect(() => {
    salesService
      .getSales({ month: selectedMonth, year: selectedYear })
      .then(setSales)
      .catch(console.error)
  }, [selectedMonth, selectedYear])

  // Group by week or just display summary
  // For now displaying detailed list focused on commission
  const totalCommission = sales.reduce(
    (acc, curr) => acc + curr.valor_comissao,
    0,
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Relatório de Comissões
        </h1>
        <MonthYearPicker />
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Total de Comissões (Mês Selecionado)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {formatCurrency(totalCommission)}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sales
                .filter((s) => s.valor_comissao > 0)
                .map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{sale.carro}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.data_venda).toLocaleDateString('pt-BR')}{' '}
                        - {sale.nome_cliente}
                      </p>
                    </div>
                    <div className="font-bold text-green-600">
                      {formatCurrency(sale.valor_comissao)}
                    </div>
                  </div>
                ))}
              {sales.filter((s) => s.valor_comissao > 0).length === 0 && (
                <p className="text-center text-muted-foreground">
                  Nenhuma comissão registrada.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
