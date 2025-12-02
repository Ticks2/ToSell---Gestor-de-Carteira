import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Upload,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react'
import { parseSalesContent } from '@/lib/parsers'
import { salesService } from '@/services/salesService'
import { ParsedSale, ImportError } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface CsvImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CsvImportModal({
  open,
  onOpenChange,
  onSuccess,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedSale[]>([])
  const [errors, setErrors] = useState<ImportError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    const text = await selectedFile.text()
    const result = parseSalesContent(text)

    setParsedData(result.sales)
    setErrors(result.errors)
  }

  const handleImport = async () => {
    if (!file || parsedData.length === 0) return

    setIsLoading(true)
    try {
      await salesService.uploadSales(parsedData)
      await salesService.logImport(file.name, parsedData.length, 'sucesso')
      toast.success(`${parsedData.length} vendas importadas com sucesso!`)
      onSuccess()
      onOpenChange(false)
      setFile(null)
      setParsedData([])
      setErrors([])
    } catch (error) {
      console.error(error)
      await salesService.logImport(file.name, 0, 'erro')
      toast.error('Falha na importação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Vendas CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV ou texto para importar as vendas. Isso
            substituirá todos os registros existentes no banco de dados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!file ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Clique para selecionar um arquivo (CSV, TXT)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.txt"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Trocar
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg bg-green-50 text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    {parsedData.length} registros válidos
                  </span>
                </div>
                {errors.length > 0 && (
                  <div className="p-3 border rounded-lg bg-red-50 text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {errors.length} erros detectados
                    </span>
                  </div>
                )}
              </div>

              {errors.length > 0 && (
                <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                  <h4 className="mb-2 text-sm font-semibold text-red-600">
                    Erros de validação:
                  </h4>
                  <div className="space-y-2">
                    {errors.map((err, idx) => (
                      <Alert key={idx} variant="destructive" className="py-2">
                        <AlertDescription className="text-xs">
                          Linha {err.row}: {err.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || isLoading || parsedData.length === 0}
          >
            {isLoading ? 'Importando...' : 'Importar Vendas'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
