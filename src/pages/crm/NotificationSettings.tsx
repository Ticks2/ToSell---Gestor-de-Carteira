import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { useAuth } from '@/hooks/use-auth'
import { crmService } from '@/services/crmService'
import {
  profileService,
  NotificationSettings as NS,
} from '@/services/profileService'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Bell, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function NotificationSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [alertTypes, setAlertTypes] = useState<string[]>([])
  const [settings, setSettings] = useState<NS>({})

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      try {
        setIsLoading(true)

        // Fetch all available alert types
        const types = await crmService.getUniqueAlertTypes(user.id)
        setAlertTypes(types)

        // Fetch current user profile settings
        const profile = await profileService.getProfile(user.id)
        if (profile.notification_settings) {
          setSettings(profile.notification_settings)
        }
      } catch (error) {
        console.error('Failed to load notification settings', error)
        toast({
          title: 'Erro ao carregar configurações',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  const handleToggle = (type: string, checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        email: checked,
      },
    }))
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await profileService.updateProfile(user.id, {
        notification_settings: settings,
      })
      toast({
        title: 'Preferências salvas com sucesso!',
      })
    } catch (error) {
      console.error('Failed to save settings', error)
      toast({
        title: 'Erro ao salvar preferências',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Notificações" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Configurações de Notificação" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/crm/alerts">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Preferências de Email
              </h2>
              <p className="text-sm text-muted-foreground">
                Escolha quais alertas você deseja receber por email.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Alertas por Email
              </CardTitle>
              <CardDescription>
                Ative para receber um email diário quando um alerta deste tipo
                estiver pendente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {alertTypes.map((type) => {
                const isEnabled = settings[type]?.email || false

                // Format type label
                let label = type
                if (type === 'birthday') label = 'Aniversários'
                else if (type === 'post-sale') label = 'Pós-Venda'
                else if (type === 'custom') label = 'Personalizados'
                else label = type.charAt(0).toUpperCase() + type.slice(1)

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between space-x-4 border p-4 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={`switch-${type}`}
                          className="text-base font-medium cursor-pointer"
                        >
                          {label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Notificar sobre {label.toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`switch-${type}`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleToggle(type, checked)}
                    />
                  </div>
                )
              })}

              {alertTypes.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum tipo de alerta encontrado. Crie alertas primeiro para
                  configurar as notificações.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving} size="lg">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Preferências
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
