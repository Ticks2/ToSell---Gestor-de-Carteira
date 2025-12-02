import { Bell, User, Search, LogOut, Shield } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { ToggleTheme } from '@/components/ui/toggle-theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export function Header({ title, children }: HeaderProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      toast({
        title: 'Erro ao sair',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-2" />
        <h1 className="text-xl font-semibold tracking-tight text-foreground hidden md:block">
          {title}
        </h1>
      </div>

      <div className="flex-1 flex justify-center max-w-md mx-auto">
        {children ? (
          <div className="w-full flex justify-center">{children}</div>
        ) : (
          <div className="relative w-full hidden sm:flex">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full bg-secondary pl-9 md:w-[300px] lg:w-[400px] border-none focus-visible:ring-1"
            />
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ToggleTheme />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-primary"
        >
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                to="/account"
                state={{ tab: 'security' }}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                <span>Segurança</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
