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
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Download, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { salesService } from '@/services/salesService'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

interface CsvImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ValidationError {
  row: number
  errors: string[]
}

export function CsvImportModal({ open, onOpenChange }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    [],
  )
  const { refreshSales } = useAppStore()
  const { toast } = useToast()

  const downloadTemplate = () => {
    const headers = [
      'Data Venda;Carro;Ano;Placa;Cliente;Gestauto;Valor Financiado;Retorno;Tipo;Comissão',
    ]
    // Add example row
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

  const parseCurrency = (value: string): number => {
    if (!value) return 0
    // Remove "R$", spaces, dots. Replace comma with dot.
    const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.')
    const num = parseFloat(cleanValue)
    return isNaN(num) ? 0 : num
  }

  const parseDate = (dateStr: string): Date | null => {
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    const date = new Date(year, month, day)
    if (isNaN(date.getTime())) return null
    return date
  }

  const validateRow = (row: string[], index: number): string[] => {
    const errors: string[] = []
    const [
      dateStr,
      car,
      yearStr,
      plate,
      client,
      gestauto,
      financedStr,
      returnType,
      type,
      commissionStr,
    ] = row

    // Date validation
    const date = parseDate(dateStr)
    if (!date) {
      errors.push('Data inválida (formato DD/MM/AAAA esperado)')
    } else if (date > new Date()) {
      errors.push('Data não pode ser futura')
    }

    // Car validation
    if (!car || car.trim() === '') errors.push('Carro é obrigatório')

    // Year validation
    const year = parseInt(yearStr, 10)
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1980 || year > currentYear + 1) {
      errors.push(`Ano deve ser entre 1980 e ${currentYear + 1}`)
    }

    // Plate validation
    if (plate && plate.trim() !== '') {
      const plateRegex = /^[A-Z]{3}-\d[A-Z0-9]\d{2}$|^[A-Z]{3}-\d{4}$/
      if (!plateRegex.test(plate.trim())) {
        errors.push('Placa inválida (AAA-9999 ou AAA-9A99)')
      }
    }

    // Client validation
    if (!client || client.trim() === '')
      errors.push('Nome do cliente é obrigatório')

    // Gestauto validation
    if (
      gestauto &&
      gestauto.trim() !== '' &&
      !['Sim', 'Não'].includes(gestauto.trim())
    ) {
      errors.push('Gestauto deve ser "Sim" ou "Não"')
    }

    // Financed Value validation
    if (financedStr && financedStr.trim() !== '') {
      const financed = parseCurrency(financedStr)
      if (financed < 0) errors.push('Valor financiado deve ser positivo')
    }

    // Return type validation
    if (
      returnType &&
      returnType.trim() !== '' &&
      !['R1', 'R2', 'R3', 'R4', 'R5'].includes(returnType.trim())
    ) {
      errors.push('Retorno deve ser R1, R2, R3, R4 ou R5')
    }

    // Operation Type validation
    if (!['Venda', 'Compra'].includes(type?.trim())) {
      errors.push('Tipo deve ser "Venda" ou "Compra"')
    }

    // Commission validation
    const commission = parseCurrency(commissionStr)
    if (commission <= 0) {
      errors.push('Comissão deve ser maior que zero')
    }

    return errors
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setValidationErrors([])

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')

      // Check header (rough check)
      if (lines.length < 2) {
        setValidationErrors([
          { row: 0, errors: ['Arquivo vazio ou sem dados'] },
        ])
        setIsLoading(false)
        return
      }

      const salesToImport = []
      const errors: ValidationError[] = []

      // Start from index 1 to skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line === '') continue // Skip empty lines

        // Try splitting by semicolon first (common in BR csv), then comma
        let columns = line.split(';')
        if (columns.length < 2) columns = line.split(',')

        // Clean quotes if present
        columns = columns.map((col) =>
          col.replace(/^["'](.*)["']$/, '$1').trim(),
        )

        const rowErrors = validateRow(columns, i + 1)

        if (rowErrors.length > 0) {
          errors.push({ row: i + 1, errors: rowErrors })
        } else {
          // Prepare data object
          salesToImport.push({
            data_venda: parseDate(columns[0])?.toISOString(),
            carro: columns[1],
            ano_carro: parseInt(columns[2], 10),
            placa: columns[3] || null,
            nome_cliente: columns[4],
            gestauto: columns[5] || null,
            valor_financiado: columns[6] ? parseCurrency(columns[6]) : null,
            retorno: columns[7] || null,
            tipo_operacao: columns[8],
            valor_comissao: parseCurrency(columns[9]),
          })
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors)
        setIsLoading(false)
      } else {
        try {
          await salesService.importSales(salesToImport)
          toast({
            title: 'Importação concluída!',
            description: `${salesToImport.length} registros foram importados com sucesso.`,
          })
          await refreshSales()
          onOpenChange(false)
          setFile(null)
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
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Vendas CSV</DialogTitle>
          <DialogDescription>
            Importe seus dados de vendas via arquivo CSV. Isso substituirá todos
            os registros existentes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 overflow-y-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Modelo CSV
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-2">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-primary hover:underline font-medium"
              >
                Selecione um arquivo
              </label>
              <p>ou arraste e solte aqui</p>
              <p className="text-xs">Apenas arquivos .csv</p>
            </div>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mt-2">
                {file.name}
              </div>
            )}
          </div>

          {validationErrors.length > 0 && (
            <Alert
              variant="destructive"
              className="max-h-[200px] overflow-y-auto"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erros de validação encontrados</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 text-xs mt-2 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>
                      <strong>Linha {err.row}:</strong> {err.errors.join(', ')}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">Nenhum dado foi importado.</p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!file || isLoading}>
            {isLoading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importando...
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
