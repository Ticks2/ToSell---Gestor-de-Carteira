import { supabase } from '@/lib/supabase/client'
import { ClientInteraction, ClientAlert, Client, Sale } from '@/types'
import {
  addDays,
  format,
  getYear,
  isSameDay,
  parseISO,
  subDays,
} from 'date-fns'
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
      .eq('is_dismissed', false)
      .order('alert_date', { ascending: true })

    if (error) throw error
    return data as ClientAlert[]
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
      this.getAlerts(userId), // Active alerts
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
        // User story says: "upcoming or on the current date"
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
            // Double check persistent "dismissed" alerts to avoid spamming?
            // For simplicity, we only check active alerts here, but ideally should check DB for any alert for this event.
            // We'll assume if it's dismissed it won't be in 'existingAlerts' (which fetches is_dismissed=false).
            // But we don't want to recreate dismissed alerts.
            // The requirement says "if an alert for that birthday doesn't already exist and is not dismissed".
            // So we need to check ALL alerts for this user/type/date
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
    const eightyDaysAgoStr = format(eightyDaysAgo, 'yyyy-MM-dd')

    sales.forEach((sale) => {
      if (sale.clientId) {
        // Check if sale date was exactly 80 days ago (or around that time if we want a window)
        // User story says: "sale date was 80 days prior"
        if (isSameDay(sale.date, eightyDaysAgo)) {
          // Check duplicates
          const exists = existingAlerts.some(
            (a) =>
              a.client_id === sale.clientId &&
              a.alert_type === 'post-sale' &&
              a.message?.includes(sale.car), // Rough check as we don't have ref ID
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

    // 4. Verify against database for dismissed alerts to avoid recreation
    if (alertsToCreate.length > 0) {
      // We need to verify if these specific alerts were already created (and potentially dismissed)
      // This is getting complex to do in one batch without proper unique constraints.
      // We will do a check for each potential alert
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
