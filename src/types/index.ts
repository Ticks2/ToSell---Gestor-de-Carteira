export type OperationType = 'Venda' | 'Compra'

export interface Client {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  city?: string | null
  birth_date?: string | null
  status: 'client' | 'lead'
  created_at: string
  user_id: string
}

export interface Sale {
  id: string
  date: Date
  car: string
  year: number
  plate?: string
  client: string
  clientId?: string
  clientDetails?: Client
  gestauto: boolean
  financedValue?: number
  saleValue?: number
  returnType?: string
  type: OperationType
  commission: number
  status: 'pending' | 'paid'
  createdAt: Date
}

export interface CommissionData {
  id?: string
  year: number
  month: number
  bonus: number
  returns: number
  transfers: number
  surplus: number
  extras: number
  salary: number
}

export interface ClientInteraction {
  id: string
  client_id: string
  user_id: string
  interaction_type: string
  interaction_date: string
  notes?: string | null
  next_contact_date?: string | null
  status: string
  created_at: string
  client?: Client
}

export interface ClientAlert {
  id: string
  client_id: string
  user_id: string
  alert_type: string
  alert_date: string
  message?: string | null
  is_dismissed: boolean
  is_email_notified: boolean
  created_at: string
  client?: Client
}

export interface ImportHistory {
  id: string
  createdAt: Date
  sourceType: string
  status: string
  totalRecords: number
  importedRecords: number
  failedRecords: number
  errorDetails: any
}

export interface ImportError {
  row: number
  message: string
  data: any
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
