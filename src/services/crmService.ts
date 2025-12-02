import { supabase } from '@/lib/supabase/client'
import { ClientInteraction, ClientAlert, Client } from '@/types'
import { format, getYear, isSameDay, parseISO, subDays } from 'date-fns'
import { salesService } from './salesService'

export const crmService = {
  // Interactions
  async getInteractions(clientId?: string, userId?: string) {
    let query = supabase
      .from('client_interactions')
      .select('*, client:clients(*)')
      .order('interaction_date', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', clientId)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query
    if (error) throw error
    return data as ClientInteraction[]
  },

  async createInteraction(interaction: Partial<ClientInteraction>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('client_interactions')
      .insert({
        ...interaction,
        user_id: user.id,
      })
      .select('*, client:clients(*)')
      .single()

    if (error) throw error
    return data as ClientInteraction
  },

  async updateInteraction(id: string, updates: Partial<ClientInteraction>) {
    const { data, error } = await supabase
      .from('client_interactions')
      .update(updates)
      .eq('id', id)
      .select('*, client:clients(*)')
      .single()

    if (error) throw error
    return data as ClientInteraction
  },

  // Alerts
  async getAlerts(userId: string) {
    const { data, error } = await supabase
      .from('client_alerts')
      .select('*, client:clients(*)')
      .eq('user_id', userId)
      .order('alert_date', { ascending: true })

    if (error) throw error
    return data as ClientAlert[]
  },

  async getUniqueAlertTypes(userId: string) {
    // Helper to get all distinct alert types used by the user
    const { data, error } = await supabase
      .from('client_alerts')
      .select('alert_type')
      .eq('user_id', userId)

    if (error) throw error

    // Extract unique types manually since .distinct() isn't a direct modifier in this context easily without query modifiers
    const types = Array.from(new Set(data.map((item) => item.alert_type)))

    // Ensure default types are always included if they haven't been used yet
    const defaultTypes = ['birthday', 'post-sale', 'custom']
    defaultTypes.forEach((t) => {
      if (!types.includes(t)) types.push(t)
    })

    return types.sort()
  },

  async createAlert(alert: Partial<ClientAlert>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('client_alerts')
      .insert({
        ...alert,
        user_id: user.id,
      })
      .select('*, client:clients(*)')
      .single()

    if (error) throw error
    return data as ClientAlert
  },

  async dismissAlert(id: string) {
    const { error } = await supabase
      .from('client_alerts')
      .update({ is_dismissed: true })
      .eq('id', id)

    if (error) throw error
  },

  // Extended Client Queries
  async getClients(userId: string, status?: 'client' | 'lead') {
    let query = supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('full_name')

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Client[]
  },

  async getClient(clientId: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (error) throw error
    return data as Client
  },

  // Automated Logic
  async syncAutomatedAlerts(userId: string) {
    // 1. Fetch necessary data
    const [clients, sales, existingAlerts] = await Promise.all([
      this.getClients(userId),
      salesService.getSales(userId),
      this.getAlerts(userId),
    ])

    const alertsToCreate: Partial<ClientAlert>[] = []
    const today = new Date()
    const currentYear = getYear(today)

    // 2. Check Birthdays
    clients.forEach((client) => {
      if (client.birth_date) {
        const birthDate = parseISO(client.birth_date)
        // Create date for current year birthday
        const thisYearBirthday = new Date(
          currentYear,
          birthDate.getMonth(),
          birthDate.getDate(),
        )
        const nextYearBirthday = new Date(
          currentYear + 1,
          birthDate.getMonth(),
          birthDate.getDate(),
        )

        // Check if birthday is upcoming (e.g. within next 30 days) or today
        const checkDate = (date: Date) => {
          const diffTime = date.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays >= 0 && diffDays <= 30
        }

        let targetBirthday: Date | null = null
        if (checkDate(thisYearBirthday)) targetBirthday = thisYearBirthday
        else if (checkDate(nextYearBirthday)) targetBirthday = nextYearBirthday

        if (targetBirthday) {
          const alertDateStr = format(targetBirthday, 'yyyy-MM-dd')

          // Check if alert already exists for this client and this date
          const exists = existingAlerts.some(
            (a) =>
              a.client_id === client.id &&
              a.alert_type === 'birthday' &&
              a.alert_date === alertDateStr,
          )

          if (!exists) {
            alertsToCreate.push({
              client_id: client.id,
              user_id: userId,
              alert_type: 'birthday',
              alert_date: alertDateStr,
              message: `Aniversário de ${client.full_name} em ${format(targetBirthday, 'dd/MM')}`,
            })
          }
        }
      }
    })

    // 3. Check Post-Sale (80 days)
    const eightyDaysAgo = subDays(today, 80)

    sales.forEach((sale) => {
      if (sale.clientId) {
        // Check if sale date was exactly 80 days ago (or around that time if we want a window)
        if (isSameDay(sale.date, eightyDaysAgo)) {
          // Check duplicates
          const exists = existingAlerts.some(
            (a) =>
              a.client_id === sale.clientId &&
              a.alert_type === 'post-sale' &&
              a.message?.includes(sale.car),
          )

          if (!exists) {
            alertsToCreate.push({
              client_id: sale.clientId,
              user_id: userId,
              alert_type: 'post-sale',
              alert_date: format(today, 'yyyy-MM-dd'), // Alert for TODAY
              message: `Pós-venda (80 dias): ${sale.car} - ${sale.client}`,
            })
          }
        }
      }
    })

    // 4. Verify against database for dismissed alerts to avoid recreation (Double check)
    if (alertsToCreate.length > 0) {
      for (const alert of alertsToCreate) {
        const { data } = await supabase
          .from('client_alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('client_id', alert.client_id)
          .eq('alert_type', alert.alert_type!)
          .eq('alert_date', alert.alert_date!)
          .maybeSingle()

        if (!data) {
          await supabase.from('client_alerts').insert(alert)
        }
      }
    }
  },
}
