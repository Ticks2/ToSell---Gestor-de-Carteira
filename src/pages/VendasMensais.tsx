import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Edit2, Trash2, Plus, Download, Search, Upload } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { Sale, OperationType } from '@/types'
import { Header } from '@/components/Header'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { SaleFormModal } from '@/components/sales/SaleFormModal'
import { CsvImportModal } from '@/components/sales/CsvImportModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function VendasMensais() {
  const {
    sales, // Access all historical sales
    selectedDate,
    setSelectedDate,
    getMonthlyData,
    addSale,
    updateSale,
    deleteSale,
    isLoading,
  } = useAppStore()

  // Get sales for the selected month (default behavior)
  const { sales: monthlySales } = useMemo(
    () => getMonthlyData(selectedDate),
    [selectedDate, getMonthlyData],
  )
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'Todas' | OperationType>('Todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | undefined>(undefined)
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null)

  const filteredSales = useMemo(() => {
    // If there is a search term, search through ALL sales.
    // Otherwise, use the sales for the selected month.
    const sourceSales = searchTerm.trim() ? sales : monthlySales

    return sourceSales.filter((sale) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        sale.client.toLowerCase().includes(term) ||
        sale.car.toLowerCase().includes(term) ||
        (sale.plate && sale.plate.toLowerCase().includes(term))

      const matchesType = filterType === 'Todas' || sale.type === filterType

      // Ensure matchesSearch is treated as a boolean for filtering
      return !!matchesSearch && matchesType
    })
  }, [monthlySales, sales, searchTerm, filterType])

  const handleAddSale = async (data: any) => {
    try {
      await addSale(data)
      setIsModalOpen(false)
      toast({
        title: 'Venda registrada com sucesso!',
        description: `${data.car} - ${data.client}`,
      })
    } catch (error) {
      toast({
        title: 'Erro ao registrar venda',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateSale = async (data: any) => {
    if (editingSale) {
      try {
        await updateSale(editingSale.id, data)
        setEditingSale(undefined)
        setIsModalOpen(false)
        toast({
          title: 'Venda atualizada!',
          description: 'As alterações foram salvas.',
        })
      } catch (error) {
        toast({
          title: 'Erro ao atualizar venda',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDeleteSale = async () => {
    if (saleToDelete) {
      try {
        await deleteSale(saleToDelete)
        setSaleToDelete(null)
        toast({ title: 'Venda removida.', variant: 'destructive' })
      } catch (error) {
        toast({
          title: 'Erro ao remover venda',
          variant: 'destructive',
        })
      }
    }
  }

  const openEditModal = (sale: Sale) => {
    setEditingSale(sale)
    setIsModalOpen(true)
  }

  const totalCommission = filteredSales.reduce(
    (acc, s) => acc + s.commission,
    0,
  )

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
                    {searchTerm
                      ? 'Nenhuma venda encontrada com os termos pesquisados.'
                      : 'Nenhuma venda encontrada neste período.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7}>
                  {searchTerm
                    ? 'Total (Resultado da Busca)'
                    : 'Total Comissões'}
                </TableCell>
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

      <SaleFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={editingSale ? handleUpdateSale : handleAddSale}
        initialData={editingSale}
      />

      <CsvImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
      />

      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro da venda será
              permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteSale}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
