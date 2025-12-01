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
  ) => void
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
      const [salesData, profileData] = await Promise.all([
        salesService.getSales(),
        profileService.getProfile(user.id),
      ])
      setSales(salesData)
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
    (year: number, month: number, data: Partial<CommissionData>) => {
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
              salary: 1991,
              ...data,
            },
          ]
        }
      })
    },
    [],
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

      // Calculate dynamic bonus based on vehicle count (Venda type only usually, but let's include all)
      const vehiclesSold = monthlySales.filter((s) => s.type === 'Venda').length
      let calculatedBonus = 0

      if (vehiclesSold >= 10) calculatedBonus = 3000
      else if (vehiclesSold >= 8) calculatedBonus = 2000
      else if (vehiclesSold >= 7) calculatedBonus = 750

      const commission = commissions.find(
        (c) => c.year === year && c.month === month,
      ) || {
        year,
        month,
        bonus: calculatedBonus, // Use calculated bonus as default if not set manually
        returns: 0,
        transfers: 0,
        surplus: 0,
        extras: 0,
        salary: 1991,
      }

      // If existing bonus is 0 but calculated is > 0, we might want to suggest it,
      // but for now let's override it dynamically for display or let commission hold manual override?
      // Requirement: "The system must display the user's current bonus based on the total number of vehicles"
      // So we will expose it separately or merge carefully.
      // We'll merge it: if commission.bonus is 0 (default), use calculated.
      // Actually, let's always return the calculated bonus as a separate field or override
      const displayBonus =
        commission.bonus !== 0 ? commission.bonus : calculatedBonus

      return {
        sales: monthlySales,
        commissionData: { ...commission, bonus: displayBonus },
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
