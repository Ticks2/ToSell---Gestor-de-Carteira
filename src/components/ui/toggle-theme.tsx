import * as React from 'react'
import { MonitorCog, MoonStar, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'

export function ToggleTheme() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
        <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted/20 animate-pulse" />
      </div>
    )
  }

  const items = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: MonitorCog },
    { value: 'dark', label: 'Dark', icon: MoonStar },
  ]

  return (
    <div className="flex items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
      {items.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
            title={label}
            aria-label={`Switch to ${label} theme`}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
