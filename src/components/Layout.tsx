import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppProvider } from '@/stores/useAppStore'

export default function Layout() {
  return (
    <AppProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-secondary/30">
          <AppSidebar />
          <SidebarInset className="flex flex-col transition-all duration-300">
            <Outlet />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppProvider>
  )
}
