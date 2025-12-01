import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import VendasMensais from '@/pages/VendasMensais'
import Comissoes from '@/pages/Comissoes'
import HistoricoImportacoes from '@/pages/HistoricoImportacoes'
import Relatorios from '@/pages/Relatorios'
import NotFound from '@/pages/NotFound'
import Layout from '@/components/Layout'

const ProtectedRoute = () => {
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendas" element={<VendasMensais />} />
            <Route path="/comissoes" element={<Comissoes />} />
            <Route path="/historico" element={<HistoricoImportacoes />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
