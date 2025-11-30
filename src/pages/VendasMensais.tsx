import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Edit2, Trash2, Plus, Download, Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { Sale, OperationType } from '@/types'
import { Header } from '@/components/Header'
import { MonthYearPicker } from '@/components/MonthYearPicker'
import { SaleFormModal } from '@/components/sales/SaleFormModal'
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

export default function VendasMensais() {
  const {
    selectedDate,
    setSelectedDate,
    getMonthlyData,
    addSale,
    updateSale,
    deleteSale,
  } = useAppStore()
  const { sales: monthlySales } = useMemo(
    () => getMonthlyData(selectedDate),
    [selectedDate, getMonthlyData],
  )
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'Todas' | OperationType>('Todas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | undefined>(undefined)
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null)

  const filteredSales = useMemo(() => {
    return monthlySales.filter((sale) => {
      const matchesSearch =
        sale.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.car.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.plate?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'Todas' || sale.type === filterType
      return matchesSearch && matchesType
    })
  }, [monthlySales, searchTerm, filterType])

  const handleAddSale = (data: any) => {
    addSale({ ...data, date: new Date(data.date) })
    setIsModalOpen(false)
    toast({
      title: 'Venda registrada com sucesso!',
      description: `${data.car} - ${data.client}`,
    })
  }

  const handleUpdateSale = (data: any) => {
    if (editingSale) {
      updateSale(editingSale.id, { ...data, date: new Date(data.date) })
      setEditingSale(undefined)
      setIsModalOpen(false)
      toast({
        title: 'Venda atualizada!',
        description: 'As alterações foram salvas.',
      })
    }
  }

  const handleDeleteSale = () => {
    if (saleToDelete) {
      deleteSale(saleToDelete)
      setSaleToDelete(null)
      toast({ title: 'Venda removida.', variant: 'destructive' })
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <MonthYearPicker date={selectedDate} onChange={setSelectedDate} />
            <div className="text-sm text-muted-foreground">
              {filteredSales.length} registros encontrados
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => console.log('Export')}>
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button
              onClick={() => {
                setEditingSale(undefined)
                setIsModalOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Venda
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
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
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Carro</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Gestauto</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id} className="group">
                  <TableCell>{format(sale.date, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${sale.type === 'Venda' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
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
                  <TableCell>{sale.gestauto ? 'Sim' : 'Não'}</TableCell>
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
              {filteredSales.length === 0 && (
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

      <SaleFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={editingSale ? handleUpdateSale : handleAddSale}
        initialData={editingSale}
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
