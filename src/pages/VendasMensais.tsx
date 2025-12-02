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
      await addSale(data)
      setIsModalOpen(false)
      toast({
        title: 'Venda registrada com sucesso!',
        description: `${data.car} - ${data.client}`,
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
        await updateSale(editingSale.id, data)
        setEditingSale(undefined)
        setIsModalOpen(false)
        toast({
          title: 'Venda atualizada!',
          description: 'As alterações foram salvas.',
        })
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
    <div className="flex flex-col h-full">
      <Header title="Vendas Mensais" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MonthYearPicker date={selectedDate} onChange={setSelectedDate} />
            <span className="text-sm text-muted-foreground ml-2 hidden md:inline-block border-l pl-3 h-6 leading-6">
              {filteredSales.length} registros
            </span>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="whitespace-nowrap"
            >
              <Upload className="mr-2 h-4 w-4" /> Importar CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => console.log('Export')}
              className="whitespace-nowrap"
            >
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button
              onClick={() => {
                setEditingSale(undefined)
                setIsModalOpen(true)
              }}
              className="whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Venda
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-lg shadow-sm border">
          <div className="w-full md:w-auto">
            <ToggleGroup
              type="single"
              value={filterType}
              onValueChange={(v) => v && setFilterType(v as any)}
            >
              <ToggleGroupItem value="Todas">Todas</ToggleGroupItem>
              <ToggleGroupItem value="Venda">Vendas</ToggleGroupItem>
              <ToggleGroupItem value="Compra">Compras</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, carro ou placa..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Carro</TableHead>
                <TableHead>Ano Modelo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Venda</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-10" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24 ml-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredSales.map((sale) => (
                    <TableRow key={sale.id} className="group">
                      <TableCell>{format(sale.date, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${sale.type === 'Venda' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}
                        >
                          {sale.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{sale.car}</TableCell>
                      <TableCell>{sale.year}</TableCell>
                      <TableCell className="uppercase font-mono text-xs">
                        {sale.plate || '-'}
                      </TableCell>
                      <TableCell>{sale.client}</TableCell>
                      <TableCell>
                        {sale.saleValue
                          ? sale.saleValue.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {sale.commission.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(sale)}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSaleToDelete(sale.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && filteredSales.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma venda encontrada neste período.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>Total Comissões</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {totalCommission.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
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
