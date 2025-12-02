export type OperationType = 'Venda' | 'Compra'

export interface Client {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  city?: string | null
  birth_date?: string | null
  status: string
  user_id: string
  created_at: string
}

export interface Sale {
  id: string
  date: Date
  car: string
  year: number
  plate?: string
  client: string
  clientId?: string
  clientDetails?: Client | null
  gestauto: boolean
  financedValue?: number
  saleValue?: number
  returnType?: 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  type: OperationType
  commission: number
  status?: 'pending' | 'paid'
  createdAt: Date
}

export interface ImportHistory {
  id: string
  createdAt: Date
  sourceType: 'Arquivo CSV' | 'Texto Colado'
  status: 'Sucesso' | 'Sucesso Parcial' | 'Falha'
  totalRecords: number
  importedRecords: number
  failedRecords: number
  errorDetails: any
}

export interface ClientInteraction {
  id: string
  client_id: string
  client?: Client
  user_id: string
  interaction_type: string
  interaction_date: string
  notes?: string | null
  next_contact_date?: string | null
  status: string
  created_at: string
}

export interface ClientAlert {
  id: string
  client_id: string
  client?: Client
  user_id: string
  alert_type: string
  alert_date: string
  message?: string | null
  is_dismissed: boolean
  is_email_notified: boolean
  created_at: string
}
