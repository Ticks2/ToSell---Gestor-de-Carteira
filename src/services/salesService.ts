import { supabase } from '@/lib/supabase/client'
import { ParsedSale, Sale, ImportHistory } from '@/types'

export const salesService = {
  async uploadSales(sales: ParsedSale[]) {
    const { error } = await supabase.rpc('replace_vendas', {
      p_vendas: sales,
    })

    if (error) {
      console.error('Error uploading sales:', error)
      throw new Error(error.message)
    }
  },

  async getSales(filters?: { month?: number; year?: number }) {
    let query = supabase
      .from('vendas')
      .select('*')
      .order('data_venda', { ascending: false })

    if (filters?.month && filters?.year) {
      const startDate = new Date(
        filters.year,
        filters.month - 1,
        1,
      ).toISOString()
      const endDate = new Date(filters.year, filters.month, 0).toISOString()
      query = query.gte('data_venda', startDate).lte('data_venda', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching sales:', error)
      throw new Error(error.message)
    }

    return data as Sale[]
  },

  async getImportHistory() {
    const { data, error } = await supabase
      .from('historico_importacoes')
      .select('*')
      .order('data_importacao', { ascending: false })

    if (error) {
      console.error('Error fetching import history:', error)
      // Suppress error if table doesn't exist yet or permission issues, return empty
      return [] as ImportHistory[]
    }

    return data as ImportHistory[]
  },

  async logImport(
    fileName: string,
    recordCount: number,
    status: 'sucesso' | 'erro',
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('historico_importacoes').insert({
      arquivo: fileName,
      registros: recordCount,
      status,
      usuario_id: user?.id,
    })

    if (error) {
      console.error('Error logging import:', error)
    }
  },

  async deleteSale(id: string) {
    const { error } = await supabase.from('vendas').delete().eq('id', id)
    if (error) throw error
  },

  async createSale(sale: Omit<Sale, 'id' | 'created_at'>) {
    const { error } = await supabase.from('vendas').insert(sale)
    if (error) throw error
  },

  async updateSale(id: string, sale: Partial<Sale>) {
    const { error } = await supabase.from('vendas').update(sale).eq('id', id)
    if (error) throw error
  },
}
