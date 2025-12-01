import { supabase } from '@/lib/supabase/client'
import { ClientInteraction, ClientAlert, Client } from '@/types'

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
}
