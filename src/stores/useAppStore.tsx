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
import { useToast } from '@/hooks/use-toast'

interface AppState {
  sales: Sale[]
  commissions: CommissionData[]
  selectedDate: Date
  isLoading: boolean
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<void>
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>
  deleteSale: (id: string) => Promise<void>
  updateCommission: (
    year: number,
    month: number,
    data: Partial<CommissionData>,
  ) => void
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
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const refreshSales = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await salesService.getSales()
      setSales(data)
    } catch (error) {
      console.error('Error fetching sales:', error)
      toast({
        title: 'Erro ao carregar vendas',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

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

  const getMonthlyData = useCallback(
    (date: Date) => {
      const month = getMonth(date)
      const year = getYear(date)

      const monthlySales = sales.filter((s) => isSameMonth(s.date, date))
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
        salary: 1991,
      }

      return { sales: monthlySales, commissionData: commission }
    },
    [sales, commissions],
  )

  const value = useMemo(
    () => ({
      sales,
      commissions,
      selectedDate,
      isLoading,
      addSale,
      updateSale,
      deleteSale,
      updateCommission,
      setSelectedDate,
      getMonthlyData,
      refreshSales,
    }),
    [
      sales,
      commissions,
      selectedDate,
      isLoading,
      addSale,
      updateSale,
      deleteSale,
      updateCommission,
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
