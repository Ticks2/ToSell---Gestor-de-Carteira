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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

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
    <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm flex-wrap sm:flex-nowrap">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        className="h-8 w-8 hover:bg-muted shrink-0"
      >
        <TabsList>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="yearly">Anual</TabsTrigger>
        </TabsList>
      </Tabs>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'min-w-[140px] justify-center text-center font-medium h-8 hover:bg-muted grow sm:grow-0',
              !date && 'text-muted-foreground',
            )}
          >
            {date ? (
              format(date, 'MMMM yyyy', { locale: ptBR }).toUpperCase()
            ) : (
              <span>Selecione</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          {/* Calendar Date Picker for quick jump */}
          <div className="p-3 border-b bg-accent/50 text-center text-xs text-muted-foreground">
            Selecione um dia para ir ao mês correspondente
          </div>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && onChange(newDate)}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      {/* Calendar Icon trigger for alternative direct access if preferred, but Popover on text is good. 
          User story: "A new UI element (e.g., a calendar icon...) must be added alongside" 
          So let's add a separate icon button as well or intead.
          If I add it alongside, it provides a clear "Pick Date" visual affordance.
      */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted shrink-0"
            title="Selecionar data"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && onChange(newDate)}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="h-8 w-8 hover:bg-muted shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
