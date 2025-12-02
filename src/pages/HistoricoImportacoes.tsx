import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { FileText, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ImportHistory {
  id: string
  created_at: string
  file_name: string
  total_rows: number
  status: 'success' | 'error' | 'processing'
  error_message?: string
}

export default function HistoricoImportacoes() {
  const { toast } = useToast()
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('import_history')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setHistory(data || [])
      } catch (error) {
        console.error('Error fetching history:', error)
        toast({
          title: 'Erro ao carregar histórico',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [toast])

  return (
    <div className="flex flex-col h-full">
      <Header title="Histórico de Importações" />

      <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Registros de Importação
            </CardTitle>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhuma importação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{item.file_name}</TableCell>
                      <TableCell>{item.total_rows}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === 'success'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {item.status === 'success' ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
