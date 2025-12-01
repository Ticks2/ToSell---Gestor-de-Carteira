import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Download,
  Upload,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { salesService } from '@/services/salesService'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { parseSalesContent } from '@/lib/parsers'

interface CsvImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CsvImportModal({ open, onOpenChange }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [activeTab, setActiveTab] = useState('file')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<
    { row: number; message: string }[]
  >([])

  const { refreshSales } = useAppStore()
  const { toast } = useToast()

  const downloadTemplate = () => {
    const headers = [
      'Data;Carro;Ano;Placa;Cliente;Gestauto;Valor Financiado;Retorno;Tipo;Comissão',
    ]
    const example =
      '15/12/2023;Honda Civic;2020;ABC-1234;João Silva;Sim;50000,00;R1;Venda;1500,00'
    const content = [...headers, example].join('\n')

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modelo_importacao_vendas.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const processContent = async (content: string) => {
    setIsLoading(true)
    setValidationErrors([])

    try {
      const { sales, errors } = parseSalesContent(content)

      if (errors.length > 0) {
        setValidationErrors(errors)
        // If we have strict errors preventing import, stop.
        // For now, we allow partial imports but let's block if no sales found
        if (sales.length === 0) {
          setIsLoading(false)
          return
        }
      }

      if (sales.length === 0) {
        toast({
          title: 'Nenhum registro encontrado',
          description:
            'Não foi possível identificar vendas no conteúdo fornecido.',
          variant: 'destructive',
        })
        setIsLoading(false)
        return
      }

      await salesService.importSales(sales)

      toast({
        title: 'Importação concluída!',
        description: `${sales.length} registros foram importados com sucesso.`,
      })
      await refreshSales()
      handleClose()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao salvar os dados no servidor.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileImport = () => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      processContent(text)
    }
    reader.readAsText(file)
  }

  const handleTextImport = () => {
    if (!textInput.trim()) return
    processContent(textInput)
  }

  const handleClose = () => {
    setFile(null)
    setTextInput('')
    setValidationErrors([])
    setActiveTab('file')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Vendas</DialogTitle>
          <DialogDescription>
            Importe seus dados via arquivo CSV ou cole o texto diretamente. O
            sistema identifica automaticamente as colunas e seções.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Arquivo CSV</TabsTrigger>
            <TabsTrigger value="text">Colar Texto</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4 min-h-[200px]">
            <TabsContent value="file" className="space-y-4 mt-0 h-full">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Modelo
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4 h-[200px]">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1 text-sm text-muted-foreground">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-primary hover:underline font-medium"
                  >
                    Selecione um arquivo
                  </label>
                  <p>ou arraste e solte aqui</p>
                  <p className="text-xs">CSV, TXT ou Excel (CSV)</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {file.name}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-0 h-full">
              <Textarea
                placeholder="Cole aqui os dados das vendas (ex: copie do Excel e cole aqui)..."
                className="h-[300px] font-mono text-xs resize-none"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </TabsContent>
          </div>
        </Tabs>

        {validationErrors.length > 0 && (
          <Alert
            variant="destructive"
            className="mt-2 max-h-[150px] overflow-y-auto shrink-0"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção aos seguintes registros</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 text-xs mt-2 space-y-1">
                {validationErrors.slice(0, 10).map((err, idx) => (
                  <li key={idx}>
                    <strong>Linha {err.row}:</strong> {err.message}
                  </li>
                ))}
                {validationErrors.length > 10 && (
                  <li>... e mais {validationErrors.length - 10} erros.</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={activeTab === 'file' ? handleFileImport : handleTextImport}
            disabled={
              isLoading ||
              (activeTab === 'file' && !file) ||
              (activeTab === 'text' && !textInput.trim())
            }
          >
            {isLoading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
