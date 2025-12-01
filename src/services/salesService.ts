import { supabase } from '@/lib/supabase/client'
import { Sale, OperationType, ImportHistory } from '@/types'

interface SaleDB {
  id: string
  data_venda: string
  carro: string
  ano_carro: number
  placa: string | null
  nome_cliente: string
  gestauto: string | null
  valor_financiado: number | null
  retorno: string | null
  tipo_operacao: string
  valor_comissao: number
  created_at: string
  user_id: string | null
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
  date: new Date(dbSale.data_venda),
  car: dbSale.carro,
  year: dbSale.ano_carro,
  plate: dbSale.placa || undefined,
  client: dbSale.nome_cliente,
  gestauto: dbSale.gestauto === 'Sim',
  financedValue: dbSale.valor_financiado || undefined,
  returnType: (dbSale.retorno as any) || undefined,
  type: dbSale.tipo_operacao as OperationType,
  commission: dbSale.valor_comissao,
  createdAt: new Date(dbSale.created_at),
})

const mapToDBType = (
  sale: Omit<Sale, 'id' | 'createdAt'>,
  userId: string,
): Omit<SaleDB, 'id' | 'created_at'> => ({
  data_venda: sale.date.toISOString(),
  carro: sale.car,
  ano_carro: sale.year,
  placa: sale.plate || null,
  nome_cliente: sale.client,
  gestauto: sale.gestauto ? 'Sim' : 'Não',
  valor_financiado: sale.financedValue || null,
  retorno: sale.returnType || null,
  tipo_operacao: sale.type,
  valor_comissao: sale.commission,
  user_id: userId,
})

const mapImportHistoryToApp = (dbHistory: ImportHistoryDB): ImportHistory => ({
  id: dbHistory.id,
  createdAt: new Date(dbHistory.created_at),
  sourceType: dbHistory.source_type as 'Arquivo CSV' | 'Texto Colado',
  status: dbHistory.status as 'Sucesso' | 'Sucesso Parcial' | 'Falha',
  totalRecords: dbHistory.total_records,
  importedRecords: dbHistory.imported_records,
  failedRecords: dbHistory.failed_records,
  errorDetails: dbHistory.error_details || [],
})

export const salesService = {
  async getSales() {
    const { data, error } = await supabase
      .from('vendas')
      .select('*')
      .order('data_venda', { ascending: false })

    if (error) throw error
    return (data as SaleDB[]).map(mapToAppType)
  },

  async createSale(sale: Omit<Sale, 'id' | 'createdAt'>) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const dbSale = mapToDBType(sale, user.id)
    const { data, error } = await supabase
      .from('vendas')
      .insert(dbSale)
      .select()
      .single()

    if (error) throw error
    return mapToAppType(data as SaleDB)
  },

  async updateSale(id: string, sale: Partial<Sale>) {
    const updates: any = {}
    if (sale.date) updates.data_venda = sale.date.toISOString()
    if (sale.car) updates.carro = sale.car
    if (sale.year) updates.ano_carro = sale.year
    if (sale.plate !== undefined) updates.placa = sale.plate || null
    if (sale.client) updates.nome_cliente = sale.client
    if (sale.gestauto !== undefined)
      updates.gestauto = sale.gestauto ? 'Sim' : 'Não'
    if (sale.financedValue !== undefined)
      updates.valor_financiado = sale.financedValue || null
    if (sale.returnType !== undefined) updates.retorno = sale.returnType || null
    if (sale.type) updates.tipo_operacao = sale.type
    if (sale.commission) updates.valor_comissao = sale.commission

    const { data, error } = await supabase
      .from('vendas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapToAppType(data as SaleDB)
  },

  async deleteSale(id: string) {
    const { error } = await supabase.from('vendas').delete().eq('id', id)

    if (error) throw error
  },

  async importSales(salesData: any[]) {
    // The RPC function now uses auth.uid() internally for security
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
      console.error('Error logging import history:', error)
    }
  },

  async getImportHistory() {
    const { data, error } = await supabase
      .from('import_history')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as ImportHistoryDB[]).map(mapImportHistoryToApp)
  },
}
