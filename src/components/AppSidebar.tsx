import { Home, BarChart2, DollarSign, FileText, History } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/' },
  { icon: FileText, label: 'Vendas Mensais', path: '/vendas' },
  { icon: DollarSign, label: 'Comissões', path: '/comissoes' },
  { icon: BarChart2, label: 'Relatórios', path: '/relatorios' },
  {
    icon: History,
    label: 'Histórico de Importações',
    path: '/historico-importacoes',
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { open } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border/50 bg-sidebar-background"
    >
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50 px-4">
        {open ? (
          <h1 className="text-lg font-bold tracking-tight text-primary truncate">
            Gestão Veículos
          </h1>
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
            G
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    'h-12 transition-all duration-200 ease-in-out rounded-md mb-1',
                    isActive
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-primary',
                  )}
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-white' : 'text-current',
                      )}
                    />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
