import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { salesService } from '@/services/salesService'
import { ImportHistory } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function HistoricoImportacoes() {
  const [history, setHistory] = useState<ImportHistory[]>([])

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await salesService.getImportHistory()
        setHistory(data)
      } catch (error) {
        console.error('Error fetching history:', error)
        toast({
          title: 'Erro ao carregar histórico',
          description: 'Não foi possível conectar ao servidor.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sucesso':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" /> Sucesso
          </Badge>
        )
      case 'Sucesso Parcial':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
          >
            <AlertTriangle className="mr-1 h-3 w-3" /> Parcial
          </Badge>
        )
      case 'Falha':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" /> Falha
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Histórico de Importações" />
      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Data/Hora da Importação</TableHead>
                <TableHead>Tipo de Origem</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    {new Date(h.data_importacao).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>{h.arquivo}</TableCell>
                  <TableCell>{h.registros}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        h.status === 'sucesso' ? 'default' : 'destructive'
                      }
                    >
                      {h.status === 'sucesso' ? 'Sucesso' : 'Erro'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum histórico encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {format(item.createdAt, "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>{item.sourceType}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-center">
                      {item.totalRecords}
                    </TableCell>
                    <TableCell className="text-center font-medium text-green-600 dark:text-green-400">
                      {item.importedRecords}
                    </TableCell>
                    <TableCell className="text-center font-medium text-red-600 dark:text-red-400">
                      {item.failedRecords}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.failedRecords > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedErrors(item.errorDetails)}
                          className="h-8 px-2 lg:px-3"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Erros
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog
        open={!!selectedErrors}
        onOpenChange={(open) => !open && setSelectedErrors(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Detalhes dos Erros
            </DialogTitle>
            <DialogDescription>
              Lista de registros que não puderam ser processados.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
            {selectedErrors && selectedErrors.length > 0 ? (
              <div className="space-y-4">
                {selectedErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1 p-3 bg-card rounded border border-l-4 border-l-destructive text-sm"
                  >
                    <div className="font-semibold text-destructive">
                      Linha {error.row}
                    </div>
                    <div>{error.message}</div>
                    {error.data && (
                      <pre className="mt-1 bg-muted p-1 rounded text-xs overflow-x-auto">
                        {JSON.stringify(error.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum detalhe disponível.
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
