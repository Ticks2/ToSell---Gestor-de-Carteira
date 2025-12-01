import { useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Header } from '@/components/Header'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getMonth, getYear } from 'date-fns'

export default function Comissoes() {
  const { selectedDate, setSelectedDate, getMonthlyData, updateCommission } =
    useAppStore()
  const { sales: monthlySales, commissionData } = useMemo(
    () => getMonthlyData(selectedDate),
    [selectedDate, getMonthlyData],
  )

  const totalSalesCommission = monthlySales.reduce(
    (acc, s) => acc + s.commission,
    0,
  )

  // Calculate total
  const totalMensal =
    totalSalesCommission +
    (commissionData.bonus || 0) +
    (commissionData.returns || 0) +
    (commissionData.transfers || 0) +
    (commissionData.surplus || 0) +
    (commissionData.extras || 0) +
    (commissionData.salary || 1991)

  const handleInputChange = (
    field: keyof typeof commissionData,
    value: string,
  ) => {
    updateCommission(getYear(selectedDate), getMonth(selectedDate), {
      [field]: Number(value),
    })
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Comissões" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Resumo Financeiro</h2>
          <MonthYearPicker date={selectedDate} onChange={setSelectedDate} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="card-shadow border-none md:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl">Detalhamento Mensal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Total Comissões (Vendas)</Label>
                  <span className="text-lg font-bold">
                    {totalSalesCommission.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Calculado automaticamente com base nas vendas lançadas.
                </p>
              </div>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bônus</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={commissionData.bonus || ''}
                      onChange={(e) =>
                        handleInputChange('bonus', e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Retorno</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={commissionData.returns || ''}
                      onChange={(e) =>
                        handleInputChange('returns', e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Salário Fixo</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={commissionData.salary || 1991}
                      onChange={(e) =>
                        handleInputChange('salary', e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Transferências</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={commissionData.transfers || ''}
                      onChange={(e) =>
                        handleInputChange('transfers', e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Excedente</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={commissionData.surplus || ''}
                      onChange={(e) =>
                        handleInputChange('surplus', e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Extras</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={commissionData.extras || ''}
                      onChange={(e) =>
                        handleInputChange('extras', e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-lg font-bold text-primary">
                  Total Mensal
                </span>
                <span className="text-2xl font-bold text-primary">
                  {totalMensal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 md:col-span-1">
            <Card className="card-shadow border-none bg-blue-50 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg">Bônus & Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>
                      Meta Básica: R$ 2.000,00 de comissão (+R$ 400 bônus)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Meta Intermediária: R$ 3.500,00 (+R$ 700 bônus)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span>Meta Premium: R$ 5.000,00 (+R$ 1.500 bônus)</span>
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-card/50 rounded-md text-xs text-muted-foreground italic">
                  * Bônus não aplicados automaticamente. Insira manualmente no
                  campo ao lado.
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow border-none">
              <CardHeader>
                <CardTitle className="text-lg">Histórico Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center border-b pb-2 last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        Mês Anterior {i}
                      </span>
                      <span className="font-medium">
                        R${' '}
                        {(totalMensal * (1 - i * 0.05)).toLocaleString(
                          'pt-BR',
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
