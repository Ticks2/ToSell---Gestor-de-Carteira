import { supabase } from '@/lib/supabase/client'
import { Client } from '@/types'

export const clientService = {
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
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
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async searchClients(query: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('full_name', `%${query}%`)
      .limit(10)

    if (error) throw error
    return data as Client[]
  },
}
