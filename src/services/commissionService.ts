import { supabase } from '@/lib/supabase/client'
import { CommissionData } from '@/types'

export const commissionService = {
  async getCommissions(userId: string) {
    const { data, error } = await supabase
      .from('monthly_commissions')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data as unknown as CommissionData[]
  },

  async upsertCommission(
    userId: string,
    commission: Partial<CommissionData> & { year: number; month: number },
  ) {
    // Check if exists first to decide if we need to include user_id in a specific way
    // or just use upsert with match on unique columns
    const { data, error } = await supabase
      .from('monthly_commissions')
      .upsert(
        {
          user_id: userId,
          month: commission.month,
          year: commission.year,
          bonus: commission.bonus,
          returns: commission.returns,
          transfers: commission.transfers,
          surplus: commission.surplus,
          extras: commission.extras,
          salary: commission.salary,
        },
        { onConflict: 'user_id,month,year' },
      )
      .select()
      .single()

    if (error) throw error
    return data as unknown as CommissionData
  },
}
