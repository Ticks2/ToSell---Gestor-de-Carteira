import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileUp, Plus, Trash2, Edit, RefreshCw } from 'lucide-react'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { CsvImportModal } from '@/components/sales/CsvImportModal'
import { SaleFormModal } from '@/components/sales/SaleFormModal'
import { salesService } from '@/services/salesService'
import { Sale } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function VendasMensais() {
  const { selectedMonth, selectedYear } = useAppStore()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const data = await salesService.getSales({
        month: selectedMonth,
        year: selectedYear,
      })
      setSales(data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao carregar vendas')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        await salesService.deleteSale(id)
        toast.success('Venda excluída')
        fetchSales()
      } catch (error) {
        toast.error('Erro ao excluir venda')
      }
    }
  }

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale)
    setSaleModalOpen(true)
  }

  const handleNew = () => {
    setSelectedSale(null)
    setSaleModalOpen(true)
  }

  const totalCommission = sales.reduce(
    (acc, curr) => acc + (curr.valor_comissao || 0),
    0,
  )
  const totalSales = sales.length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas Mensais</h1>
          <p className="text-muted-foreground">
            Gerencie suas vendas e comissões.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthYearPicker />
          <Button variant="outline" size="icon" onClick={fetchSales}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Comissões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média por Venda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSales > 0
                ? formatCurrency(totalCommission / totalSales)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">comissão média</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhuma venda encontrada para este período.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {new Date(sale.data_venda).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sale.nome_cliente}
                    </TableCell>
                    <TableCell>
                      {sale.carro}{' '}
                      <span className="text-muted-foreground text-xs">
                        ({sale.ano_carro})
                      </span>
                    </TableCell>
                    <TableCell>{sale.placa || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sale.tipo_operacao === 'Compra'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {sale.tipo_operacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(sale.valor_comissao)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => sale.id && handleDelete(sale.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CsvImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={fetchSales}
      />

      <SaleFormModal
        open={saleModalOpen}
        onOpenChange={setSaleModalOpen}
        sale={selectedSale}
        onSuccess={fetchSales}
      />
    </div>
  )
}
