import { Bell, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-2" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground hidden md:block">
          {title}
        </h1>
      </div>
      <div className="flex-1 flex justify-center max-w-md mx-auto hidden sm:flex">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-full bg-secondary pl-9 md:w-[300px] lg:w-[400px] border-none focus-visible:ring-1"
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
        >
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
