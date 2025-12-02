import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Sale } from '@/types'

interface MonthlyCommissionDetailsProps {
  salary: number
  setSalary: (value: number) => void
  onSaveSalary: () => void
  sales: Sale[]
}

export function MonthlyCommissionDetails({
  salary,
  setSalary,
  onSaveSalary,
  sales,
}: MonthlyCommissionDetailsProps) {
  const commissionedSales = sales.filter((s) => s.valor_comissao > 0)

  return (
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
                <Button size="icon" onClick={onSaveSalary}>
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
              {commissionedSales.length > 0 ? (
                commissionedSales.map((sale) => (
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
  )
}
