import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ThemeProvider } from 'next-themes'
import Dashboard from './pages/Dashboard'
import VendasMensais from './pages/VendasMensais'
import Comissoes from './pages/Comissoes'
import Relatorios from './pages/Relatorios'
import HistoricoImportacoes from './pages/HistoricoImportacoes'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Account from './pages/Account'
import Layout from './components/Layout'

// CRM Pages
import CrmClients from './pages/crm/CrmClients'
import CrmKanban from './pages/crm/CrmKanban'
import CrmAlerts from './pages/crm/CrmAlerts'
import ClientDetails from './pages/crm/ClientDetails'

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth()

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Carregando...
      </div>
    )
  if (!session) return <Navigate to="/login" replace />

  return <Layout />
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vendas" element={<VendasMensais />} />
              <Route path="/comissoes" element={<Comissoes />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route
                path="/historico-importacoes"
                element={<HistoricoImportacoes />}
              />
              <Route path="/account" element={<Account />} />

              {/* CRM Routes */}
              <Route
                path="/crm"
                element={<Navigate to="/crm/clients" replace />}
              />
              <Route path="/crm/clients" element={<CrmClients />} />
              <Route path="/crm/kanban" element={<CrmKanban />} />
              <Route path="/crm/alerts" element={<CrmAlerts />} />
              <Route path="/crm/clients/:id" element={<ClientDetails />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </BrowserRouter>
)

export default App
