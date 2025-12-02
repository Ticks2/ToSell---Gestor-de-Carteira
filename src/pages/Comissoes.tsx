import { useEffect, useState, useCallback } from 'react'
import { salesService } from '@/services/salesService'
import { commissionsService } from '@/services/commissionsService'
import { Sale } from '@/types'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { CommissionSummaryCards } from '@/components/commissions/CommissionSummaryCards'
import { MonthlyCommissionDetails } from '@/components/commissions/MonthlyCommissionDetails'
import { YearlyCommissionTable } from '@/components/commissions/YearlyCommissionTable'
import { YearlyCommissionData } from '@/types/commissions'

export default function Comissoes() {
  const { selectedMonth, selectedYear, viewMode } = useAppStore()
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [salary, setSalary] = useState<number>(0)
  const [_loading, setLoading] = useState(false)
  const [yearlyData, setYearlyData] = useState<YearlyCommissionData[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (viewMode === 'monthly') {
        const salesData = await salesService.getSales({
          month: selectedMonth,
          year: selectedYear,
        })
        setSales(salesData)

        const commissionData = await commissionsService.getMonthlyCommission(
          selectedMonth,
          selectedYear,
        )

        if (commissionData && commissionData.salary !== null) {
          setSalary(commissionData.salary)
        } else {
          const now = new Date()
          const currentDate = new Date(now.getFullYear(), now.getMonth(), 1)
          const targetDate = new Date(selectedYear, selectedMonth - 1, 1)

          if (targetDate >= currentDate) {
            setSalary(0)
          } else {
            setSalary(0)
          }
        }
      } else {
        const salesData = await salesService.getSales({ year: selectedYear })
        const commissionsData =
          await commissionsService.getYearlyCommissions(selectedYear)

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
        setSales(salesData)
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
  }, [selectedMonth, selectedYear, viewMode, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

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
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o salário.',
      })
    }
  }

  const salesCommissionTotal = sales.reduce(
    (acc, curr) => acc + curr.valor_comissao,
    0,
  )
  const yearlySalesTotal = yearlyData.reduce((acc, curr) => acc + curr.sales, 0)
  const yearlySalaryTotal = yearlyData.reduce(
    (acc, curr) => acc + curr.salary,
    0,
  )

  const totalIncome =
    viewMode === 'monthly'
      ? salesCommissionTotal + salary
      : yearlyData.reduce((acc, curr) => acc + curr.total, 0)

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

      <CommissionSummaryCards
        viewMode={viewMode}
        salesCommissionTotal={salesCommissionTotal}
        salary={salary}
        yearlySalesTotal={yearlySalesTotal}
        yearlySalaryTotal={yearlySalaryTotal}
        totalIncome={totalIncome}
        salesCount={sales.filter((s) => s.valor_comissao > 0).length}
      />

      {viewMode === 'monthly' && (
        <MonthlyCommissionDetails
          salary={salary}
          setSalary={setSalary}
          onSaveSalary={handleSaveSalary}
          sales={sales}
        />
      )}

      {viewMode === 'yearly' && (
        <YearlyCommissionTable
          selectedYear={selectedYear}
          yearlyData={yearlyData}
        />
      )}
    </div>
  )
}
