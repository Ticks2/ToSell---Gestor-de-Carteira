export interface Sale {
  id?: string
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
  created_at?: string
}

export interface MonthlyCommission {
  id: string
  user_id: string
  month: number
  year: number
  salary: number | null
  bonus: number | null
  extras: number | null
  surplus: number | null
  returns: number | null
  transfers: number | null
  created_at: string
}

export interface ImportError {
  row: number
  message: string
  data: any
}

export interface ImportHistory {
  id: string
  data_importacao: string
  arquivo: string
  registros: number
  status: 'sucesso' | 'erro'
  usuario_id?: string
}

export interface ParsedSale {
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
}
