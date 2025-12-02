import { supabase } from '@/lib/supabase/client'
import { Client } from '@/types'

export const clientService = {
  async getClients(userId?: string) {
    let uid = userId
    if (!uid) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []
      uid = user.id
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', uid)
      .order('full_name', { ascending: true })

    if (error) throw error
    return data as Client[]
  },

  async createClient(client: Omit<Client, 'id' | 'created_at'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        full_name: client.full_name,
        birth_date: client.birth_date || null,
        city: client.city || null,
        phone: client.phone || null,
        email: client.email || null,
        status: client.status || 'client',
      })
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async updateClient(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update({
        full_name: updates.full_name,
        birth_date: updates.birth_date || null,
        city: updates.city || null,
        phone: updates.phone || null,
        email: updates.email || null,
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },

  async searchClients(query: string, userId?: string) {
    let uid = userId
    if (!uid) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []
      uid = user.id
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', uid)
      .ilike('full_name', `%${query}%`)
      .limit(10)

    if (error) throw error
    return data as Client[]
  },
}
