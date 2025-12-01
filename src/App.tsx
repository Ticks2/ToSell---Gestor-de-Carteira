import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Dashboard from './pages/Dashboard'
import VendasMensais from './pages/VendasMensais'
import Comissoes from './pages/Comissoes'
import Relatorios from './pages/Relatorios'
import HistoricoImportacoes from './pages/HistoricoImportacoes'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import Layout from './components/Layout'

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth()

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  return <>{children}</>
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
