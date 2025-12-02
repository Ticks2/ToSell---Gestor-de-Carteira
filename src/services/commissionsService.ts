import { supabase } from '@/lib/supabase/client'
import { MonthlyCommission } from '@/types'

export const commissionsService = {
  async getMonthlyCommission(month: number, year: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('monthly_commissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (error) {
      console.error('Error fetching monthly commission:', error)
      throw error
    }
    return data as MonthlyCommission | null
  },

  async upsertMonthlyCommission(
    data: Partial<MonthlyCommission> & { month: number; year: number },
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Construct payload ensuring user_id is present
    const payload = {
      ...data,
      user_id: user.id,
    }

    // We use upsert with onConflict on (user_id, month, year)
    // Note: Requires a unique constraint on these columns in DB
    const { data: result, error } = await supabase
      .from('monthly_commissions')
      .upsert(payload, { onConflict: 'user_id, month, year' })
      .select()
      .single()

    if (error) {
      console.error('Error upserting monthly commission:', error)
      throw error
    }

    return result as MonthlyCommission
  },

  async getYearlyCommissions(year: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('monthly_commissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', year)
      .order('month', { ascending: true })

    if (error) {
      console.error('Error fetching yearly commissions:', error)
      throw error
    }

    return data as MonthlyCommission[]
  },
}
