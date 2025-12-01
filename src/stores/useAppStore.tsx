import { create } from 'zustand'

interface AppState {
  selectedMonth: number
  selectedYear: number
  setMonth: (month: number) => void
  setYear: (year: number) => void
}

const useAppStore = create<AppState>((set) => ({
  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),
  setMonth: (month) => set({ selectedMonth: month }),
  setYear: (year) => set({ selectedYear: year }),
}))

export default useAppStore
