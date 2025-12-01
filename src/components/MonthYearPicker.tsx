import * as React from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface MonthYearPickerProps {
  date: Date
  onChange: (date: Date) => void
}

export function MonthYearPicker({ date, onChange }: MonthYearPickerProps) {
  const handlePrevious = () => onChange(subMonths(date, 1))
  const handleNext = () => onChange(addMonths(date, 1))

  return (
    <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        className="h-8 w-8 hover:bg-muted"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-[180px] justify-start text-left font-medium h-8 hover:bg-muted',
              !date && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? (
              format(date, 'MMMM yyyy', { locale: ptBR }).toUpperCase()
            ) : (
              <span>Selecione</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 text-sm text-center text-muted-foreground">
            Use as setas para navegar
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="h-8 w-8 hover:bg-muted"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
