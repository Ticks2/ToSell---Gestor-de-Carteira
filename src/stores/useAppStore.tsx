import { create } from 'zustand'

interface AppState {
  selectedMonth: number
  selectedYear: number
  viewMode: 'monthly' | 'yearly'
  setMonth: (month: number) => void
  setYear: (year: number) => void
  setViewMode: (mode: 'monthly' | 'yearly') => void
}

const useAppStore = create<AppState>((set) => ({
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  viewMode: 'monthly',
  setMonth: (month) => set({ selectedMonth: month }),
  setYear: (year) => set({ selectedYear: year }),
  setViewMode: (mode) => set({ viewMode: mode }),
}))

export default useAppStore
