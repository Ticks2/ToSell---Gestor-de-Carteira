import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react'
import { Sale, CommissionData } from '@/types'
import { isSameMonth, getMonth, getYear } from 'date-fns'
import { salesService } from '@/services/salesService'
import { profileService } from '@/services/profileService'
import { commissionService } from '@/services/commissionService'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface AppState {
  sales: Sale[]
  commissions: CommissionData[]
  selectedDate: Date
  isLoading: boolean
  monthlyGoal: number
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>
  deleteSale: (id: string) => Promise<void>
  updateCommission: (
    year: number,
    month: number,
    data: Partial<CommissionData>,
  ) => Promise<void>
  updateMonthlyGoal: (target: number) => Promise<void>
  setSelectedDate: (date: Date) => void
  getMonthlyData: (date: Date) => {
    sales: Sale[]
    commissionData: CommissionData
  }
  refreshSales: () => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sales, setSales] = useState<Sale[]>([])
  const [commissions, setCommissions] = useState<CommissionData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [monthlyGoal, setMonthlyGoal] = useState(5000)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const refreshSales = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [salesData, profileData, commissionsData] = await Promise.all([
        salesService.getSales(user.id),
        profileService.getProfile(user.id),
        commissionService.getCommissions(user.id),
      ])
      setSales(salesData)
      setCommissions(commissionsData)
      if (profileData?.monthly_commission_target) {
        setMonthlyGoal(profileData.monthly_commission_target)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, user])

  useEffect(() => {
    refreshSales()
  }, [refreshSales])

  const addSale = useCallback(
    async (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
      try {
        const newSale = await salesService.createSale(saleData)
        setSales((prev) => [newSale, ...prev])
      } catch (error) {
        console.error('Error adding sale:', error)
        throw error
      }
    },
    [],
  )

  const updateSale = useCallback(
    async (id: string, updatedData: Partial<Sale>) => {
      try {
        const updatedSale = await salesService.updateSale(id, updatedData)
        setSales((prev) => prev.map((s) => (s.id === id ? updatedSale : s)))
      } catch (error) {
        console.error('Error updating sale:', error)
        throw error
      }
    },
    [],
  )

  const deleteSale = useCallback(async (id: string) => {
    try {
      await salesService.deleteSale(id)
      setSales((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Error deleting sale:', error)
      throw error
    }
  }, [])

  const updateCommission = useCallback(
    async (year: number, month: number, data: Partial<CommissionData>) => {
      if (!user) return

      // Default salary is 0
      const defaultSalary = 0

      // Check if entry exists before optimistic update changes state
      const existing = commissions.find(
        (c) => c.year === year && c.month === month,
      )

      // Optimistic update
      setCommissions((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.year === year && c.month === month,
        )
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = { ...updated[existingIndex], ...data }
          return updated
        } else {
          return [
            ...prev,
            {
              year,
              month,
              bonus: 0,
              returns: 0,
              transfers: 0,
              surplus: 0,
              extras: 0,
              salary: defaultSalary,
              ...data,
            },
          ]
        }
      })

      try {
        const payload = {
          year,
          month,
          ...data,
        } as any

        // If creating a new entry (not existing in state) and salary is not provided in update data,
        // we inject the default salary to ensure it overrides DB default if needed.
        if (!existing && payload.salary === undefined) {
          payload.salary = defaultSalary
        }

        await commissionService.upsertCommission(user.id, payload)
      } catch (error) {
        console.error('Error updating commission:', error)
        toast({
          title: 'Erro ao salvar comissão',
          description: 'Suas alterações podem não ter sido salvas.',
          variant: 'destructive',
        })
      }
    },
    [user, toast, commissions],
  )

  const updateMonthlyGoal = useCallback(
    async (target: number) => {
      if (!user) return
      try {
        await profileService.updateProfile(user.id, {
          monthly_commission_target: target,
        })
        setMonthlyGoal(target)
        toast({ title: 'Meta atualizada com sucesso!' })
      } catch (error) {
        console.error('Error updating goal:', error)
        toast({ title: 'Erro ao atualizar meta', variant: 'destructive' })
      }
    },
    [user, toast],
  )

  const getMonthlyData = useCallback(
    (date: Date) => {
      const month = getMonth(date)
      const year = getYear(date)

      const monthlySales = sales.filter((s) => isSameMonth(s.date, date))

      // Default salary is 0
      const defaultSalary = 0

      const commission = commissions.find(
        (c) => c.year === year && c.month === month,
      ) || {
        year,
        month,
        bonus: 0,
        returns: 0,
        transfers: 0,
        surplus: 0,
        extras: 0,
        salary: defaultSalary,
      }

      return {
        sales: monthlySales,
        commissionData: commission,
      }
    },
    [sales, commissions],
  )

  const value = useMemo(
    () => ({
      sales,
      commissions,
      selectedDate,
      isLoading,
      monthlyGoal,
      addSale,
      updateSale,
      deleteSale,
      updateCommission,
      updateMonthlyGoal,
      setSelectedDate,
      getMonthlyData,
      refreshSales,
    }),
    [
      sales,
      commissions,
      selectedDate,
      isLoading,
      monthlyGoal,
      addSale,
      updateSale,
      deleteSale,
      updateCommission,
      updateMonthlyGoal,
      getMonthlyData,
      refreshSales,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

const useAppStore = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}

export default useAppStore
