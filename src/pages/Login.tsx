import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useNavigate, Link } from 'react-router-dom'
import { Car, Loader2, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      navigate('/')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Side - Hero / Brand */}
      <div className="hidden lg:flex w-1/2 bg-black relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/90 z-10" />
        <img
          src="https://img.usecurling.com/p/1200/1600?q=luxury%20car%20showroom&color=black"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay grayscale"
        />
        <div className="relative z-20 text-white p-12 max-w-lg">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Car className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Gestão de Vendas
            </h1>
          </div>
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed text-zinc-300">
              "Controle total das suas comissões e vendas em um único lugar.
              Simples, rápido e eficiente."
            </p>
          </blockquote>
          <div className="mt-8 flex gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Controle Financeiro</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Metas Mensais</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Histórico Completo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="mx-auto w-full max-w-[350px] space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? 'Preencha os dados abaixo para começar'
                : 'Entre com seu email e senha para acessar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                {!isSignUp && (
                  <Link
                    to="#"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>
            <Button className="w-full h-11" type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                'Criar Conta'
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {isSignUp ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="underline underline-offset-4 hover:text-primary font-medium text-foreground transition-colors"
            >
              {isSignUp ? 'Entrar agora' : 'Criar conta'}
            </button>
          </div>

          <p className="px-8 text-center text-xs text-muted-foreground">
            Ao clicar em continuar, você concorda com nossos{' '}
            <Link
              to="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link
              to="#"
              className="underline underline-offset-4 hover:text-primary"
            >
              Política de Privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
