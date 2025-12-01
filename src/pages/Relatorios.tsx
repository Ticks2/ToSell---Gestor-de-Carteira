import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Relatorios() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
      <Card>
        <CardHeader>
          <CardTitle>Em desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta funcionalidade estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
