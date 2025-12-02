export type OperationType = 'Venda' | 'Compra'

export interface Client {
  id: string
  user_id: string
  full_name: string
  email?: string | null
  phone?: string | null
  city?: string | null
  birth_date?: string | null
  status: string
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

export interface ClientInteraction {
  id: string
  user_id: string
  client_id: string
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
  user_id: string
  client_id: string
  alert_type: string
  alert_date: string
  message?: string | null
  is_email_notified?: boolean | null
  is_dismissed?: boolean | null
  created_at: string
  client?: Client
}
