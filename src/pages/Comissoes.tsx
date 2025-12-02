import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { useAuth } from '@/hooks/use-auth'
import { commissionService } from '@/services/commissionService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function Comissoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [date, setDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(true)
  const [commissionData, setCommissionData] = useState<any>(null)

  const fetchCommissions = useCallback(
    async (userId: string, selectedDate: Date) => {
      try {
        setIsLoading(true)
        const data = await commissionService.getCommission(
          userId,
          selectedDate.getMonth() + 1,
          selectedDate.getFullYear(),
        )
        setCommissionData(data)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (user) {
      fetchCommissions(user.id, date)
    }
  }, [user, date, fetchCommissions])

  return (
    <div className="flex flex-col h-full">
      <Header title="Comissões">
        <MonthYearPicker
          date={date}
          setDate={setDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </Header>

      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Salário Fixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? '...'
                  : formatCurrency(commissionData?.fixedIncome || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Comissão Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading
                  ? '...'
                  : formatCurrency(commissionData?.salesCommission || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">DSR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency(commissionData?.dsr || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? '...' : formatCurrency(commissionData?.total || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {!commissionData && !isLoading && (
          <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
            Nenhum dado de comissão encontrado para este período.
          </div>
        )}
      </div>
    </div>
  )
}
