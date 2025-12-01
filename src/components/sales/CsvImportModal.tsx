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
  CheckCircle,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { salesService } from '@/services/salesService'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { parseSalesContent } from '@/lib/parsers'
import { ImportError } from '@/types'
import { Link } from 'react-router-dom'

interface CsvImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CsvImportModal({ open, onOpenChange }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [activeTab, setActiveTab] = useState('file')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([])
  const [importResult, setImportResult] = useState<{
    success: boolean
    imported: number
    failed: number
  } | null>(null)

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
    setImportResult(null)

    let parsedSales: any[] = []
    let parseErrors: ImportError[] = []

    try {
      const result = parseSalesContent(content)
      parsedSales = result.sales
      parseErrors = result.errors
    } catch (err: any) {
      console.error('Critical parsing error', err)
      parseErrors.push({
        row: 0,
        message: `Erro crítico no processamento do arquivo: ${err.message}`,
      })
    }

    const totalRecords = parsedSales.length + parseErrors.length
    let importedRecords = 0
    let failedRecords = parseErrors.length
    let status: 'Sucesso' | 'Sucesso Parcial' | 'Falha' = 'Falha'
    let currentErrors = [...parseErrors]

    try {
      if (parsedSales.length > 0) {
        await salesService.importSales(parsedSales)
        importedRecords = parsedSales.length

        if (failedRecords === 0) {
          status = 'Sucesso'
          toast({
            title: 'Importação concluída!',
            description: `${parsedSales.length} registros foram importados com sucesso.`,
          })
        } else {
          status = 'Sucesso Parcial'
          toast({
            title: 'Importação Parcial',
            description: `${parsedSales.length} importados. ${failedRecords} falharam. Verifique os detalhes.`,
            variant: 'warning',
          })
        }

        setImportResult({
          success: true,
          imported: importedRecords,
          failed: failedRecords,
        })
      } else {
        status = 'Falha'
        // If we had content but parsed 0 sales and 0 errors, it implies unrecognized format
        if (totalRecords === 0 && content.trim().length > 0) {
          currentErrors.push({
            row: 0,
            message:
              'Não foi possível identificar nenhum registro de venda válido. Verifique se o cabeçalho contém "Data" e "Carro".',
          })
          failedRecords = 1
        }

        toast({
          title: 'Falha na importação',
          description:
            'Nenhum registro pôde ser importado. Verifique os erros.',
          variant: 'destructive',
        })

        setImportResult({
          success: false,
          imported: 0,
          failed: failedRecords || 1,
        })
      }

      if (parsedSales.length > 0) {
        await refreshSales()
      }
    } catch (error: any) {
      console.error(error)
      status = 'Falha'
      failedRecords = totalRecords
      importedRecords = 0
      currentErrors.push({
        row: 0,
        message: `Erro crítico no banco de dados: ${error.message || 'Desconhecido'}`,
      })

      toast({
        title: 'Erro Crítico na Importação',
        description:
          'Falha ao salvar dados. Verifique o histórico de importações.',
        variant: 'destructive',
      })

      setImportResult({
        success: false,
        imported: 0,
        failed: totalRecords || 1,
      })
    } finally {
      setValidationErrors(currentErrors)

      try {
        await salesService.logImport({
          sourceType: activeTab === 'file' ? 'Arquivo CSV' : 'Texto Colado',
          status,
          totalRecords: totalRecords || 1,
          importedRecords,
          failedRecords: currentErrors.length,
          errorDetails: currentErrors,
        })
      } catch (logErr) {
        console.error('Failed to log import history', logErr)
      }

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
    setImportResult(null)
    setActiveTab('file')
    onOpenChange(false)
  }

  const resetState = () => {
    setFile(null)
    setTextInput('')
    setValidationErrors([])
    setImportResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Vendas</DialogTitle>
          <DialogDescription>
            Importe seus dados via arquivo CSV ou cole o texto diretamente
            (Excel, etc).
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
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
                    <p className="text-xs">CSV ou TXT</p>
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
                  placeholder="Cole aqui os dados das vendas (suporta tabelas copiadas do Excel)..."
                  className="h-[300px] font-mono text-xs resize-none"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-4">
            {importResult.success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <AlertCircle className="h-16 w-16 text-destructive" />
            )}
            <h3 className="text-lg font-semibold">
              {importResult.success
                ? 'Processamento Concluído'
                : 'Falha no Processamento'}
            </h3>
            <div className="flex gap-4 text-sm">
              <div className="text-green-600 font-medium">
                Importados: {importResult.imported}
              </div>
              <div className="text-red-600 font-medium">
                Falhas: {importResult.failed}
              </div>
            </div>
            <Button variant="outline" onClick={resetState} className="mt-4">
              Nova Importação
            </Button>
          </div>
        )}

        {validationErrors.length > 0 && (
          <Alert
            variant="destructive"
            className="mt-2 max-h-[150px] overflow-y-auto shrink-0"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>
              Registros com erro ({validationErrors.length})
            </AlertTitle>
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
              <div className="mt-2 pt-2 border-t border-destructive/30">
                <Link
                  to="/historico-importacoes"
                  onClick={handleClose}
                  className="text-xs font-semibold underline hover:text-destructive/80"
                >
                  Ver detalhes completos no Histórico
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!importResult && (
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={
                activeTab === 'file' ? handleFileImport : handleTextImport
              }
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
        )}
      </DialogContent>
    </Dialog>
  )
}
