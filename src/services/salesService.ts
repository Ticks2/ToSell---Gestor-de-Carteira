import { supabase } from '@/lib/supabase/client'
import { Sale, OperationType, ImportHistory, Client } from '@/types'
import { parseISO, format } from 'date-fns'

interface SaleDB {
  id: string
  data_venda: string
  carro: string
  ano_carro: number
  placa: string | null
  nome_cliente: string
  client_id: string | null
  clients?: Client | null
  gestauto: string | null
  valor_financiado: number | null
  valor_venda: number | null
  retorno: string | null
  tipo_operacao: string
  valor_comissao: number
  created_at: string
  user_id: string | null
  status?: string // Optional in DB interface as it might not exist in DB but used in mapping
}

const mapToAppType = (dbSale: SaleDB): Sale => ({
  id: dbSale.id,
  date: parseISO(dbSale.data_venda),
  car: dbSale.carro,
  year: dbSale.ano_carro,
  plate: dbSale.placa || undefined,
  client: dbSale.nome_cliente,
  clientId: dbSale.client_id || undefined,
  clientDetails: dbSale.clients || undefined,
  clientCity: dbSale.clients?.city || undefined,
  gestauto: dbSale.gestauto || undefined,
  financedValue: dbSale.valor_financiado || undefined,
  saleValue: dbSale.valor_venda || undefined,
  returnType: (dbSale.retorno as any) || undefined,
  type: dbSale.tipo_operacao as OperationType,
  commission: dbSale.valor_comissao,
  status: (dbSale.status as 'pending' | 'paid') || 'pending', // Default to pending if status column missing
  createdAt: new Date(dbSale.created_at),
  userId: dbSale.user_id || undefined,
})

const mapToDBType = (
  sale: Omit<Sale, 'id' | 'createdAt'>,
  userId: string,
): Omit<SaleDB, 'id' | 'created_at' | 'clients' | 'status'> => ({
  data_venda: format(sale.date, 'yyyy-MM-dd'),
  carro: sale.car,
  ano_carro: sale.year,
  placa: sale.plate || null,
  nome_cliente: sale.client,
  client_id: sale.clientId || null,
  gestauto: sale.gestauto || null,
  valor_financiado: sale.financedValue || null,
  valor_venda: sale.saleValue || null,
  retorno: sale.returnType || null,
  tipo_operacao: sale.type,
  valor_comissao: sale.commission,
  // status field removed to prevent "column does not exist" error
  user_id: userId,
})

export const salesService = {
  async getSales(userId?: string) {
    let uid = userId
    if (!uid) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []
      uid = user.id
    }

    const { data, error } = await supabase
      .from('vendas')
      .select('*, clients(*)')
      .eq('user_id', uid)
      .order('data_venda', { ascending: false })

    if (error) throw error
    return (data as unknown as SaleDB[]).map(mapToAppType)
  },

  async getSale(id: string) {
    const { data, error } = await supabase
      .from('vendas')
      .select('*, clients(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return mapToAppType(data as unknown as SaleDB)
  },

  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const dbSale = mapToDBType(sale, user.id)

    const { data: inserted, error: insertError } = await supabase
      .from('vendas')
      .insert(dbSale)
      .select()
      .single()

    if (insertError) throw insertError

    const { data: completeData, error: fetchError } = await supabase
      .from('vendas')
      .select('*, clients(*)')
      .eq('id', inserted.id)
      .single()

    if (fetchError) throw fetchError

    return mapToAppType(completeData as unknown as SaleDB)
  },

  async updateSale(id: string, sale: Partial<Sale>) {
    const updates: any = {}
    if (sale.date) updates.data_venda = format(sale.date, 'yyyy-MM-dd')

    if (sale.car) updates.carro = sale.car
    if (sale.year) updates.ano_carro = sale.year
    if (sale.plate !== undefined) updates.placa = sale.plate || null
    if (sale.client) updates.nome_cliente = sale.client
    if (sale.clientId !== undefined) updates.client_id = sale.clientId

    if (sale.gestauto !== undefined) updates.gestauto = sale.gestauto || null
    if (sale.financedValue !== undefined)
      updates.valor_financiado = sale.financedValue || null
    if (sale.saleValue !== undefined)
      updates.valor_venda = sale.saleValue || null
    if (sale.returnType !== undefined) updates.retorno = sale.returnType || null
    if (sale.type) updates.tipo_operacao = sale.type
    if (sale.commission) updates.valor_comissao = sale.commission
    // Status update removed as column does not exist in DB schema provided

    const { error: updateError } = await supabase
      .from('vendas')
      .update(updates)
      .eq('id', id)

    if (updateError) throw updateError

    const { data, error } = await supabase
      .from('vendas')
      .select('*, clients(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return mapToAppType(data as unknown as SaleDB)
  },

  async deleteSale(id: string) {
    const { error } = await supabase.from('vendas').delete().eq('id', id)
    if (error) throw error
  },

  async importSales(salesData: any[]) {
    const { error } = await supabase.rpc('replace_vendas', {
      p_vendas: salesData,
    })
    if (error) throw error
  },

  async logImport(
    fileName: string,
    count: number,
    status: 'sucesso' | 'erro',
  ): Promise<void> {
    const { error } = await supabase.from('import_history').insert({
      source_type: 'csv',
      status: status === 'sucesso' ? 'success' : 'error',
      total_records: count,
      imported_records: status === 'sucesso' ? count : 0,
      failed_records: status === 'sucesso' ? 0 : count,
      error_details: { file_name: fileName },
    })

    if (error) {
      console.error('Error logging import:', error)
      // Don't throw here to avoid blocking the UI if just logging fails
    }
  },

  async getImportHistory() {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching import history:', error)
      return [] as ImportHistory[]
    }

    return data.map((item: any) => ({
      id: item.id,
      createdAt: new Date(item.created_at),
      sourceType: item.source_type,
      status: item.status,
      totalRecords: item.total_records,
      importedRecords: item.imported_records,
      failedRecords: item.failed_records,
      errorDetails: item.error_details || [],
    }))
  },

  async uploadSales(sales: any[]) {
    const dbSales = sales.map((s) => {
      return {
        data_venda: s.data_venda,
        carro: s.carro,
        ano_carro: s.ano_carro,
        placa: s.placa,
        nome_cliente: s.nome_cliente,
        gestauto: s.gestauto,
        valor_financiado: s.valor_financiado,
        valor_venda: s.valor_venda || 0,
        retorno: s.retorno,
        tipo_operacao: s.tipo_operacao,
        valor_comissao: s.valor_comissao,
      }
    })

    const { error } = await supabase.rpc('replace_vendas', {
      p_vendas: dbSales,
    })

    if (error) throw error
  },
}
