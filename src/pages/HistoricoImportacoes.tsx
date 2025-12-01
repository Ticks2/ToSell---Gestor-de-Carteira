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
    salesService.getImportHistory().then(setHistory).catch(console.error)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">
        Histórico de Importações
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Logs de Importação</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Registros</TableHead>
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
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
