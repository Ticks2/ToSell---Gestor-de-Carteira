import { useMemo, useState, useEffect } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Header } from '@/components/Header'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { getMonth, getYear } from 'date-fns'
import { Save } from 'lucide-react'
import { CommissionData } from '@/types'

export default function Comissoes() {
  const {
    selectedDate,
    setSelectedDate,
    getMonthlyData,
    updateCommission,
    monthlyGoal,
    updateMonthlyGoal,
  } = useAppStore()
  const { sales: monthlySales, commissionData } = useMemo(
    () => getMonthlyData(selectedDate),
    [selectedDate, getMonthlyData],
  )
  const [goalInput, setGoalInput] = useState(monthlyGoal.toString())

  useEffect(() => {
    setGoalInput(monthlyGoal.toString())
  }, [monthlyGoal])

  const totalSalesCommission = monthlySales.reduce(
    (acc, s) => acc + s.commission,
    0,
  )

  // Determine current tier for visual feedback
  const vehiclesSold = monthlySales.filter((s) => s.type === 'Venda').length

  // Using saved bonus
  const currentBonus = commissionData.bonus || 0

  // Calculate total
  const totalMensal =
    totalSalesCommission +
    currentBonus +
    (commissionData.returns || 0) +
    (commissionData.transfers || 0) +
    (commissionData.surplus || 0) +
    (commissionData.extras || 0) +
    (commissionData.salary || 1991)

  const handleInputChange = (field: keyof CommissionData, value: string) => {
    updateCommission(getYear(selectedDate), getMonth(selectedDate), {
      [field]: Number(value),
    })
  }

  const handleSaveGoal = () => {
    updateMonthlyGoal(Number(goalInput))
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Comissões" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-lg font-semibold">Resumo Financeiro</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-card p-1 rounded border shadow-sm">
              <span className="text-sm font-medium pl-2">Meta Mensal: R$</span>
              <Input
                className="w-24 h-8 border-none focus-visible:ring-0"
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={handleSaveGoal}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
            <MonthYearPicker date={selectedDate} onChange={setSelectedDate} />
          </div>
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
                  {vehiclesSold} veículos vendidos neste mês.
                </p>
              </div>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex justify-between h-5 items-center">
                    <span>Bônus</span>
                    {currentBonus > 0 && (
                      <span className="text-green-600 font-bold text-xs">
                        Ativo
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={
                        commissionData.bonus === 0 ? '' : commissionData.bonus
                      }
                      onChange={(e) =>
                        handleInputChange('bonus', e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex h-5 items-center">Retorno</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-2.5 text-muted-foreground text-xs">
                      R$
                    </span>
                    <Input
                      type="number"
                      className="pl-6"
                      value={
                        commissionData.returns === 0
                          ? ''
                          : commissionData.returns
                      }
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
                      value={
                        commissionData.transfers === 0
                          ? ''
                          : commissionData.transfers
                      }
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
                      value={
                        commissionData.surplus === 0
                          ? ''
                          : commissionData.surplus
                      }
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
                      value={
                        commissionData.extras === 0 ? '' : commissionData.extras
                      }
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
                <CardTitle className="text-lg">
                  Regras de Bônus por Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li
                    className={`flex items-center gap-3 p-2 rounded ${vehiclesSold >= 7 && vehiclesSold < 8 ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${vehiclesSold >= 7 ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <div className="flex-1">
                      <span className="font-medium">7 Veículos Vendidos</span>
                      <p className="text-xs text-muted-foreground">
                        Bônus: +R$ 750,00
                      </p>
                    </div>
                  </li>
                  <li
                    className={`flex items-center gap-3 p-2 rounded ${vehiclesSold >= 8 && vehiclesSold < 10 ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${vehiclesSold >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <div className="flex-1">
                      <span className="font-medium">8 Veículos Vendidos</span>
                      <p className="text-xs text-muted-foreground">
                        Bônus: +R$ 2.000,00
                      </p>
                    </div>
                  </li>
                  <li
                    className={`flex items-center gap-3 p-2 rounded ${vehiclesSold >= 10 && vehiclesSold < 12 ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${vehiclesSold >= 10 ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <div className="flex-1">
                      <span className="font-medium">10 Veículos Vendidos</span>
                      <p className="text-xs text-muted-foreground">
                        Bônus: +R$ 3.000,00
                      </p>
                    </div>
                  </li>
                  <li
                    className={`flex items-center gap-3 p-2 rounded ${vehiclesSold >= 12 ? 'bg-green-100 dark:bg-green-900/30' : ''}`}
                  >
                    <div
                      className={`h-3 w-3 rounded-full ${vehiclesSold >= 12 ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                    <div className="flex-1">
                      <span className="font-medium">12 Veículos Vendidos</span>
                      <p className="text-xs text-muted-foreground">
                        Bônus: +R$ 3.500,00
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium">
                    Progresso Atual: {vehiclesSold} vendas
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
