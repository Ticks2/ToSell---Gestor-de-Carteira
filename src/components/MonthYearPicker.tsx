import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  addMonths,
  addYears,
  format,
  setMonth,
  setYear,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
  getYear,
  getMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'

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
  const [isOpen, setIsOpen] = React.useState(false)
  const [menuDate, setMenuDate] = React.useState(date)
  const [internalMode, setInternalMode] = React.useState<'month' | 'year'>(
    'month',
  )

  React.useEffect(() => {
    if (isOpen) {
      setMenuDate(date)
      // Initialize internal mode based on viewMode
      // If yearly view, we start and stay in year mode
      // If monthly view, we start in month mode but can toggle to year
      setInternalMode(viewMode === 'yearly' ? 'year' : 'month')
    }
  }, [isOpen, date, viewMode])

  const handlePrevious = () => {
    const newDate =
      viewMode === 'monthly' ? subMonths(date, 1) : subYears(date, 1)
    setDate(
      viewMode === 'monthly' ? startOfMonth(newDate) : startOfYear(newDate),
    )
  }

  const handleNext = () => {
    const newDate =
      viewMode === 'monthly' ? addMonths(date, 1) : addYears(date, 1)
    setDate(
      viewMode === 'monthly' ? startOfMonth(newDate) : startOfYear(newDate),
    )
  }

  const handleMenuPreviousYear = () => {
    setMenuDate(subYears(menuDate, 1))
  }

  const handleMenuNextYear = () => {
    setMenuDate(addYears(menuDate, 1))
  }

  const handleMenuPreviousDecade = () => {
    setMenuDate(subYears(menuDate, 12))
  }

  const handleMenuNextDecade = () => {
    setMenuDate(addYears(menuDate, 12))
  }

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(setYear(date, getYear(menuDate)), monthIndex)
    setDate(startOfMonth(newDate))
    setIsOpen(false)
  }

  const handleYearSelect = (year: number) => {
    if (viewMode === 'yearly') {
      const newDate = setYear(date, year)
      setDate(startOfYear(newDate))
      setIsOpen(false)
    } else {
      // In monthly mode, selecting a year updates the menu date and goes back to month selection
      setMenuDate(setYear(menuDate, year))
      setInternalMode('month')
    }
  }

  const toggleInternalMode = () => {
    setInternalMode((prev) => (prev === 'month' ? 'year' : 'month'))
  }

  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const currentYear = getYear(menuDate)
  // Generate a range of 12 years centered somewhat around the current menu date year
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 6 + i)

  // Determine if we should show the year picker grid
  const showYearPicker = viewMode === 'yearly' || internalMode === 'year'

  return (
    <div
      className={cn(
        'flex items-center gap-2 flex-wrap sm:flex-nowrap',
        onViewModeChange && 'bg-card p-1 rounded-lg border shadow-sm',
      )}
    >
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

      <div className="flex items-center gap-1 bg-background border border-input rounded-md p-0.5 ml-auto sm:ml-0">
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
                'w-[150px] h-8 justify-start text-left font-normal px-2',
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
          <PopoverContent className="w-64 p-0" align="start">
            <div className="p-3">
              {!showYearPicker ? (
                /* Month Selection View */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleMenuPreviousYear}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-semibold text-sm h-7 px-2"
                      onClick={toggleInternalMode}
                      title="Selecionar ano"
                    >
                      {currentYear}
                      <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleMenuNextYear}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => (
                      <Button
                        key={month}
                        variant="ghost"
                        className={cn(
                          'h-8 text-xs px-0',
                          getYear(date) === currentYear &&
                            getMonth(date) === index &&
                            'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                        )}
                        onClick={() => handleMonthSelect(index)}
                      >
                        {month.slice(0, 3)}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                /* Year Selection View */
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleMenuPreviousDecade}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-sm">
                      {years[0]} - {years[years.length - 1]}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleMenuNextDecade}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {years.map((year) => (
                      <Button
                        key={year}
                        variant="ghost"
                        className={cn(
                          'h-8 text-xs',
                          getYear(date) === year &&
                            'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                        )}
                        onClick={() => handleYearSelect(year)}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
