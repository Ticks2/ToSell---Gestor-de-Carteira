export type OperationType = 'Venda' | 'Compra'

export interface Client {
  id: string
  user_id: string
  full_name: string
  birth_date?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  status: 'client' | 'lead'
  created_at: string
}

export interface Sale {
  id: string
  type: OperationType
  date: Date
  clientId?: string
  client: string // Name snapshot
  clientDetails?: Client // Joined data
  car: string
  year: number
  plate?: string
  saleValue?: number
  financedValue?: number
  commission: number
  returnType?: string
  gestauto?: string
  status: 'pending' | 'paid'
  createdAt: Date
  userId?: string
}

export interface CommissionData {
  id?: string
  user_id?: string
  month: number
  year: number
  bonus: number | null
  returns: number | null
  transfers: number | null
  surplus: number | null
  extras: number | null
  salary: number | null
  created_at?: string
}

export interface ClientInteraction {
  id: string
  client_id: string
  user_id: string
  interaction_type: string
  interaction_date: string
  next_contact_date?: string | null
  notes?: string | null
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
  is_dismissed?: boolean | null
  is_email_notified?: boolean | null
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
  errorDetails: any[]
}
