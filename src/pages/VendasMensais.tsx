import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { salesService } from '@/services/salesService'
import { Sale } from '@/types'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { SaleFormModal } from '@/components/sales/SaleFormModal'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO, startOfMonth } from 'date-fns'

export default function VendasMensais() {
  const { user } = useAuth()
  const [date, setDate] = useState(startOfMonth(new Date()))
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly')
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  const fetchSales = useCallback(
    async (userId: string, selectedDate: Date) => {
      try {
        setIsLoading(true)
        const allSales = await salesService.getSales(userId)

        const filtered = allSales.filter((s: Sale) => {
          const sDate = new Date(s.date)
          if (viewMode === 'monthly') {
            return (
              sDate.getMonth() === selectedDate.getMonth() &&
              sDate.getFullYear() === selectedDate.getFullYear()
            )
          } else {
            return sDate.getFullYear() === selectedDate.getFullYear()
          }
        })

        setSales(filtered)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    },
    [viewMode],
  )

  useEffect(() => {
    if (user) {
      fetchSales(user.id, date)
    }
  }, [user, date, fetchSales])

  const handleEdit = (id: string) => {
    setSelectedSaleId(id)
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setSelectedSaleId(null)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Vendas Mensais">
        <MonthYearPicker
          date={date}
          setDate={setDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </Header>

      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Registros de Vendas</h2>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Vendas de{' '}
              {format(date, viewMode === 'monthly' ? 'MMMM/yyyy' : 'yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Loader2 className="animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma venda registrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(parseISO(sale.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{sale.car}</TableCell>
                      <TableCell>{formatCurrency(sale.value)}</TableCell>
                      <TableCell>{formatCurrency(sale.commission)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(sale.id!)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <SaleFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        saleId={selectedSaleId}
        onSuccess={() => user && fetchSales(user.id, date)}
      />
    </div>
  )
}
