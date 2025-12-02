export type OperationType =
  | 'Venda'
  | 'Compra'
  | 'Troca'
  | 'Financiamento'
  | 'Consignação'

export interface Client {
  id: string
  user_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  city?: string | null
  birth_date?: string | null
  status: 'client' | 'lead'
  created_at: string
}

export interface Sale {
  id: string
  userId?: string
  clientId?: string
  client: string // Nome do Cliente
  clientDetails?: Client
  car: string
  year: number
  plate?: string
  date: Date
  type: OperationType | string
  saleValue?: number
  financedValue?: number
  commission: number
  gestauto?: string // Changed to string for text input
  returnType?: string
  status: 'pending' | 'paid'
  createdAt: Date
}

export interface ClientInteraction {
  id: string
  user_id: string
  client_id: string
  client?: Client
  interaction_type: string
  interaction_date: string
  notes?: string | null
  next_contact_date?: string | null
  status: string
  created_at: string
}

export interface ClientAlert {
  id: string
  user_id: string
  client_id: string
  client?: Client
  alert_type: string
  alert_date: string
  message?: string | null
  is_dismissed?: boolean | null
  is_email_notified?: boolean | null
  created_at: string
}

export interface CommissionData {
  id?: string
  user_id?: string
  year: number
  month: number
  bonus?: number | null
  returns?: number | null
  transfers?: number | null
  surplus?: number | null
  extras?: number | null
  salary?: number | null
  created_at?: string
}

export interface ImportHistory {
  id: string
  createdAt: Date
  sourceType: string
  status: 'success' | 'error' | 'processing'
  totalRecords: number
  importedRecords: number
  failedRecords: number
  errorDetails: ImportError[] | null
}

export interface ImportError {
  row: number
  message: string
  data?: any
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
