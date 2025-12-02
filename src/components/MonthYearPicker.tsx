import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  format,
  startOfMonth,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface MonthYearPickerProps {
  date: Date
  setDate: (date: Date) => void
  viewMode?: 'monthly' | 'yearly'
  onViewModeChange?: (mode: 'monthly' | 'yearly') => void
}

export function MonthYearPicker({
  date,
  setDate,
  viewMode = 'monthly',
  onViewModeChange,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const currentYear = new Date().getFullYear()

  const handlePrevious = () => {
    const baseDate = startOfMonth(date)
    if (viewMode === 'monthly') {
      setDate(subMonths(baseDate, 1))
    } else {
      setDate(subYears(baseDate, 1))
    }
  }

  const handleNext = () => {
    const baseDate = startOfMonth(date)
    if (viewMode === 'monthly') {
      setDate(addMonths(baseDate, 1))
    } else {
      setDate(addYears(baseDate, 1))
    }
  }

  return (
    <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm flex-wrap sm:flex-nowrap">
      {onViewModeChange && (
        <Tabs
          value={viewMode}
          onValueChange={(v) => onViewModeChange(v as 'monthly' | 'yearly')}
          className="w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="monthly" className="text-xs px-2">
              Mensal
            </TabsTrigger>
            <TabsTrigger value="yearly" className="text-xs px-2">
              Anual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="flex items-center gap-1 bg-background border rounded-md p-0.5 shadow-sm ml-auto sm:ml-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-[140px] h-8 justify-start text-left font-normal px-2',
                !date && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? (
                format(date, viewMode === 'monthly' ? 'MMMM yyyy' : 'yyyy', {
                  locale: ptBR,
                })
              ) : (
                <span>Selecione...</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(startOfMonth(d))
                  setIsOpen(false)
                }
              }}
              initialFocus
              locale={ptBR}
              captionLayout="dropdown-buttons"
              fromYear={2020}
              toYear={currentYear + 1}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
