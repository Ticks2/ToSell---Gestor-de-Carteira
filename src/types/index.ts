export type OperationType = 'Venda' | 'Compra'

export interface Client {
  id: string
  full_name: string
  birth_date?: string | null // ISO Date string YYYY-MM-DD
  city?: string | null
  phone?: string | null
  email?: string | null
  status: 'client' | 'lead'
  created_at?: string
}

export interface Sale {
  id: string
  date: Date
  car: string
  year: number
  plate?: string

  // Client info
  client: string // Display name (kept for compatibility)
  clientId?: string // Link to client record
  clientDetails?: Client // Full object if available

  gestauto?: boolean
  financedValue?: number
  saleValue?: number // valor_venda
  returnType?: 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  type: OperationType
  commission: number
  createdAt: Date
}

export interface CommissionData {
  id?: string
  month: number // 0-11
  year: number
  bonus: number
  returns: number
  transfers: number
  surplus: number
  extras: number
  salary: number // Fixed default 1991
}

export interface SalesSummary {
  totalSales: number
  totalCommissions: number
  totalGoal: number // Configurable goal
  percentageGoal: number
}

export interface ImportError {
  row: number
  message: string
  data?: any
}

export interface ImportHistory {
  id: string
  createdAt: Date
  sourceType: 'Arquivo CSV' | 'Texto Colado'
  status: 'Sucesso' | 'Sucesso Parcial' | 'Falha'
  totalRecords: number
  importedRecords: number
  failedRecords: number
  errorDetails: ImportError[]
}

export interface ClientInteraction {
  id: string
  client_id: string
  user_id: string
  interaction_date: string // ISO timestamp
  interaction_type: string
  notes: string | null
  next_contact_date: string | null // ISO Date YYYY-MM-DD
  status: string
  created_at: string
  client?: Client // Joined data
}

export interface ClientAlert {
  id: string
  client_id: string
  user_id: string
  alert_type: string
  alert_date: string // ISO Date YYYY-MM-DD
  message: string | null
  is_dismissed: boolean
  created_at: string
  client?: Client // Joined data
}
