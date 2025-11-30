export type OperationType = 'Venda' | 'Compra'

export interface Sale {
  id: string
  date: Date
  car: string
  year: number
  plate?: string
  client: string
  gestauto?: boolean
  financedValue?: number
  returnType?: 'R1' | 'R2' | 'R3' | 'R4' | 'R5'
  type: OperationType
  commission: number
  createdAt: Date
}

export interface CommissionData {
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
  totalGoal: number // Mocked goal
  percentageGoal: number
}
