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
  status?: string
}

interface ImportHistoryDB {
  id: string
  created_at: string
  source_type: string
  status: string
  total_records: number
  imported_records: number
  failed_records: number
  error_details: any
}

const mapToAppType = (dbSale: SaleDB): Sale => ({
  id: dbSale.id,
  date: parseISO(dbSale.data_venda),
  car: dbSale.carro,
  year: dbSale.ano_carro,
  plate: dbSale.placa || undefined,
  client: dbSale.clients?.full_name || dbSale.nome_cliente,
  clientId: dbSale.client_id || undefined,
  clientDetails: dbSale.clients || undefined,
  gestauto: dbSale.gestauto === 'Sim',
  financedValue: dbSale.valor_financiado || undefined,
  saleValue: dbSale.valor_venda || undefined,
  returnType: (dbSale.retorno as any) || undefined,
  type: dbSale.tipo_operacao as OperationType,
  commission: dbSale.valor_comissao,
  status: (dbSale.status as 'pending' | 'paid') || 'pending',
  createdAt: new Date(dbSale.created_at),
})

const mapToDBType = (
  sale: Omit<Sale, 'id' | 'createdAt'>,
  userId: string,
): Omit<SaleDB, 'id' | 'created_at' | 'clients'> => ({
  data_venda: format(sale.date, 'yyyy-MM-dd'),
  carro: sale.car,
  ano_carro: sale.year,
  placa: sale.plate || null,
  nome_cliente: sale.client,
  client_id: sale.clientId || null,
  gestauto: sale.gestauto ? 'Sim' : 'Não',
  valor_financiado: sale.financedValue || null,
  valor_venda: sale.saleValue || null,
  retorno: sale.returnType || null,
  tipo_operacao: sale.type,
  valor_comissao: sale.commission,
  status: sale.status || 'pending',
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

    if (sale.gestauto !== undefined)
      updates.gestauto = sale.gestauto ? 'Sim' : 'Não'
    if (sale.financedValue !== undefined)
      updates.valor_financiado = sale.financedValue || null
    if (sale.saleValue !== undefined)
      updates.valor_venda = sale.saleValue || null
    if (sale.returnType !== undefined) updates.retorno = sale.returnType || null
    if (sale.type) updates.tipo_operacao = sale.type
    if (sale.commission) updates.valor_comissao = sale.commission
    if (sale.status) updates.status = sale.status

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
    history: Omit<ImportHistory, 'id' | 'createdAt'>,
  ): Promise<void> {
    const { error } = await supabase.from('import_history').insert({
      source_type: history.sourceType,
      status: history.status,
      total_records: history.totalRecords,
      imported_records: history.importedRecords,
      failed_records: history.failedRecords,
      error_details: history.errorDetails,
    })

    if (error) {
      console.error('Error logging import:', error)
      throw new Error(error.message)
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
}
