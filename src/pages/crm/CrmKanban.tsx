import { useEffect, useState, useMemo } from 'react'
import useCrmStore from '@/stores/useCrmStore'
import { Header } from '@/components/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { GripVertical } from 'lucide-react'
import { ClientInteraction } from '@/types'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { id: 'New Lead', title: 'Novos Leads', color: 'bg-blue-500' },
  { id: 'Contacted', title: 'Contatado', color: 'bg-yellow-500' },
  { id: 'Follow-up Scheduled', title: 'Follow-up', color: 'bg-purple-500' },
  { id: 'Opportunity', title: 'Oportunidade', color: 'bg-orange-500' },
  { id: 'Closed Won', title: 'Fechado (Ganho)', color: 'bg-green-500' },
  { id: 'Closed Lost', title: 'Perdido', color: 'bg-red-500' },
]

export default function CrmKanban() {
  const { interactions, fetchInteractions, updateInteractionStatus } =
    useCrmStore()
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    fetchInteractions()
  }, [fetchInteractions])

  // Group latest interaction per client, or show all active interactions?
  // For CRM Kanban, usually we track active 'Deals'.
  // Here we will list all interactions but grouped by status.

  const columns = useMemo(() => {
    const cols: Record<string, ClientInteraction[]> = {}
    COLUMNS.forEach((c) => (cols[c.id] = []))

    interactions.forEach((interaction) => {
      if (cols[interaction.status]) {
        cols[interaction.status].push(interaction)
      } else {
        // Fallback for unknown statuses
        if (!cols['New Lead']) cols['New Lead'] = []
        cols['New Lead'].push(interaction)
      }
    })
    return cols
  }, [interactions])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) {
      updateInteractionStatus(id, status)
    }
    setDraggedId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="CRM - Kanban" />
      <div className="flex-1 overflow-x-auto p-4 md:p-6">
        <div className="flex h-full gap-4 min-w-[1200px]">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex flex-col w-80 bg-secondary/20 rounded-lg border border-border/50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div
                className={`p-3 rounded-t-lg border-b border-border/50 font-semibold flex justify-between items-center bg-card`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  {column.title}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {columns[column.id]?.length || 0}
                </Badge>
              </div>

              <ScrollArea className="flex-1 p-2">
                <div className="space-y-3">
                  {columns[column.id]?.map((item) => (
                    <Card
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className={cn(
                        'cursor-grab active:cursor-grabbing hover:shadow-md transition-all',
                        draggedId === item.id && 'opacity-50',
                      )}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            to={`/crm/clients/${item.client_id}`}
                            className="font-medium text-sm hover:underline text-primary truncate"
                          >
                            {item.client?.full_name || 'Cliente desconhecido'}
                          </Link>
                          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.notes || 'Sem notas'}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-border/30 mt-2">
                          <Badge variant="outline" className="text-[10px] h-5">
                            {item.interaction_type}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(item.interaction_date), 'dd/MM')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
