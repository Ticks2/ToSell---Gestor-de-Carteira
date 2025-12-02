import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useAppStore from '@/stores/useAppStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export function MonthYearPicker() {
  const {
    selectedMonth,
    selectedYear,
    viewMode,
    setMonth,
    setYear,
    setViewMode,
  } = useAppStore()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i)

  const handlePrevious = () => {
    if (viewMode === 'monthly') {
      if (selectedMonth === 1) {
        setMonth(12)
        setYear(selectedYear - 1)
      } else {
        setMonth(selectedMonth - 1)
      }
    } else {
      setYear(selectedYear - 1)
    }
  }

  const handleNext = () => {
    if (viewMode === 'monthly') {
      if (selectedMonth === 12) {
        setMonth(1)
        setYear(selectedYear + 1)
      } else {
        setMonth(selectedMonth + 1)
      }
    } else {
      setYear(selectedYear + 1)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as 'monthly' | 'yearly')}
        className="w-fit"
      >
        <TabsList>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="yearly">Anual</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {viewMode === 'monthly' && (
          <Select
            value={selectedMonth.toString()}
            onValueChange={(val) => setMonth(Number(val))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={selectedYear.toString()}
          onValueChange={(val) => setYear(Number(val))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
