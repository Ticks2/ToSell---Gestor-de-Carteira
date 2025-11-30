import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react'
import { Sale, CommissionData } from '@/types'
import { addMonths, isSameMonth, getMonth, getYear } from 'date-fns'

// MOCK DATA GENERATION
const generateMockSales = (): Sale[] => {
  const sales: Sale[] = []
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  for (let i = 0; i < 50; i++) {
    const date = addMonths(startOfYear, Math.floor(Math.random() * 11))
    date.setDate(Math.floor(Math.random() * 28) + 1)

    sales.push({
      id: Math.random().toString(36).substr(2, 9),
      date: date,
      car: [
        'Honda Civic',
        'Toyota Corolla',
        'Fiat Uno',
        'Jeep Compass',
        'VW Gol',
      ][Math.floor(Math.random() * 5)],
      year: 2020 + Math.floor(Math.random() * 5),
      plate: `ABC-${1000 + i}`,
      client: `Cliente ${i + 1}`,
      type: Math.random() > 0.2 ? 'Venda' : 'Compra',
      commission:
        Math.random() > 0.2
          ? [400, 500, 600, 800][Math.floor(Math.random() * 4)]
          : 600,
      createdAt: new Date(),
      gestauto: Math.random() > 0.5,
      returnType: 'R1',
    })
  }
  return sales
}

interface AppState {
  sales: Sale[]
  commissions: CommissionData[]
  selectedDate: Date
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => void
  updateSale: (id: string, sale: Partial<Sale>) => void
  deleteSale: (id: string) => void
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
}

const AppContext = createContext<AppState | null>(null)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sales, setSales] = useState<Sale[]>([])
  const [commissions, setCommissions] = useState<CommissionData[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Initialize with mock data
  useEffect(() => {
    setSales(generateMockSales())
  }, [])

  const addSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const newSale: Sale = {
      ...saleData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }
    setSales((prev) => [...prev, newSale])
  }

  const updateSale = (id: string, updatedData: Partial<Sale>) => {
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s)),
    )
  }

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id))
  }

  const updateCommission = (
    year: number,
    month: number,
    data: Partial<CommissionData>,
  ) => {
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
  }

  const getMonthlyData = (date: Date) => {
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
  }

  const value = useMemo(
    () => ({
      sales,
      commissions,
      selectedDate,
      addSale,
      updateSale,
      deleteSale,
      updateCommission,
      setSelectedDate,
      getMonthlyData,
    }),
    [sales, commissions, selectedDate],
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
