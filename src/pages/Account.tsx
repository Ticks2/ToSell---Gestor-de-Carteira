import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { profileService, Profile } from '@/services/profileService'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, LogOut, KeyRound, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Account() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    if (location.state && (location.state as any).tab) {
      setActiveTab((location.state as any).tab)
    }
  }, [location])

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        const data = await profileService.getProfile(user.id)
        setProfile(data)
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
        })
        setPreviewUrl(data.avatar_url)
      } catch (error) {
        console.error('Error loading profile:', error)
        // Profile might not exist yet if trigger failed or timing, but we handle it gracefully
        setProfile({
          id: 'temp',
          user_id: user.id,
          full_name: '',
          bio: '',
          avatar_url: null,
          company_id: null,
          role: 'individual',
          created_at: new Date().toISOString(),
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      let avatarUrl = profile?.avatar_url

      if (avatarFile) {
        avatarUrl = await profileService.uploadAvatar(user.id, avatarFile)
      }

      const updatedProfile = await profileService.updateProfile(user.id, {
        full_name: formData.full_name,
        bio: formData.bio,
        avatar_url: avatarUrl,
      })

      setProfile(updatedProfile)
      toast({
        title: 'Perfil atualizado com sucesso!',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.password !== passwordData.confirmPassword) {
      toast({
        title: 'As senhas não conferem',
        variant: 'destructive',
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.password,
      })

      if (error) throw error

      toast({
        title: 'Senha atualizada com sucesso',
        description: 'Sua nova senha já está ativa.',
      })
      setPasswordData({ password: '', confirmPassword: '' })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar senha',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      toast({
        title: 'Erro ao sair',
        variant: 'destructive',
      })
    } else {
      navigate('/login')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Minha Conta" />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="card-shadow border-none">
                <CardHeader>
                  <CardTitle>Perfil do Usuário</CardTitle>
                  <CardDescription>
                    Gerencie suas informações públicas e privadas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      <div className="relative group">
                        <Avatar className="h-24 w-24 border-2 border-border">
                          <AvatarImage src={previewUrl || undefined} />
                          <AvatarFallback className="text-2xl">
                            {formData.full_name?.charAt(0) ||
                              user?.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <label
                          htmlFor="avatar-upload"
                          className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Upload className="h-6 w-6 text-white" />
                        </label>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="text-lg font-medium">Foto de Perfil</h3>
                        <p className="text-sm text-muted-foreground">
                          Clique na imagem para alterar. PNG, JPG ou GIF.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email} disabled />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Seu nome"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Biografia</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) =>
                            setFormData({ ...formData, bio: e.target.value })
                          }
                          placeholder="Um pouco sobre você..."
                          className="resize-none min-h-[100px]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvar Alterações
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="card-shadow border-none border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Zona de Perigo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">Sair da conta</h4>
                      <p className="text-sm text-muted-foreground">
                        Encerrar sua sessão atual neste dispositivo.
                      </p>
                    </div>
                    <Button variant="destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="card-shadow border-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Segurança da Conta
                  </CardTitle>
                  <CardDescription>
                    Atualize suas credenciais de acesso.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">Nova Senha</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-9"
                          value={passwordData.password}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              password: e.target.value,
                            })
                          }
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirmar Nova Senha
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-9"
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Atualizar Senha
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
