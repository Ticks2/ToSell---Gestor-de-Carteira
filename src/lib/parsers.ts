import { parse, isValid, format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { ImportError } from '@/types'

export interface ParsedSale {
  data_venda: string
  carro: string
  ano_carro: number
  placa: string | null
  nome_cliente: string
  gestauto: string | null
  valor_financiado: number | null
  retorno: string | null
  tipo_operacao: string
  valor_comissao: number
}

export interface ParseResult {
  sales: ParsedSale[]
  errors: ImportError[]
}

// Flattened aliases for easier lookup
const HEADER_ALIASES: Record<string, string[]> = {
  data_venda: ['data', 'data venda', 'dt venda', 'dia', 'date', 'dt'],
  carro: ['carro', 'veiculo', 'modelo', 'descrição', 'descricao', 'car'],
  ano_carro: ['ano', 'ano car', 'ano modelo', 'year'],
  placa: ['placa', 'plate'],
  nome_cliente: ['cliente', 'nome', 'nome cli', 'comprador', 'client'],
  gestauto: ['gestauto', 'garantia'],
  valor_financiado: [
    'valor financiado',
    'financiado',
    'finan',
    'vlr financiado',
    'financed',
  ],
  retorno: ['retorno', 'ret', 'return'],
  tipo_operacao: [
    'tipo',
    'operacao',
    'tipo operacao',
    'compra/venda',
    'type',
    'compra?',
    'compra',
  ],
  valor_comissao: [
    'comissao',
    'comissão',
    'valor',
    'vlr',
    'valor comissao',
    'lucro',
    'commission',
  ],
}

// Prioritize M/d/yyyy as per user story for complex imports, then standard formats
const DATE_FORMATS = [
  'M/d/yyyy', // 12/7/2025, 1/16/2025
  'MM/dd/yyyy', // 01/16/2025
  'dd/MM/yyyy', // 16/01/2025 (BR Standard)
  'd/M/yyyy', // 16/1/2025
  'yyyy-MM-dd', // ISO
  'dd-MM-yyyy',
]

const detectSeparator = (text: string): string => {
  const lines = text.split(/\r?\n/).slice(0, 10)
  let semiCount = 0
  let commaCount = 0
  let tabCount = 0
  lines.forEach((l) => {
    semiCount += (l.match(/;/g) || []).length
    commaCount += (l.match(/,/g) || []).length
    tabCount += (l.match(/\t/g) || []).length
  })
  if (tabCount > semiCount && tabCount > commaCount) return '\t'
  if (semiCount > commaCount) return ';'
  return ','
}

const splitLine = (line: string, separator: string): string[] => {
  if (separator === '\t') return line.split('\t').map((c) => c.trim())
  // Simple CSV split handling quotes loosely
  const cells: string[] = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuote = !inQuote
    } else if (char === separator && !inQuote) {
      cells.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim().replace(/^"|"$/g, ''))
  return cells
}

const parseCurrency = (value: string): number => {
  if (!value) return 0
  const clean = value.toString().replace(/R\$|\s/g, '')
  if (clean.includes(',') && clean.includes('.')) {
    const lastDot = clean.lastIndexOf('.')
    const lastComma = clean.lastIndexOf(',')
    if (lastDot > lastComma) return parseFloat(clean.replace(/,/g, ''))
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'))
  } else if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'))
  }
  return parseFloat(clean) || 0
}

const parseDateStr = (value: string): Date | null => {
  if (!value) return null
  const v = value.trim()
  for (const fmt of DATE_FORMATS) {
    const d = parse(v, fmt, new Date(), { locale: ptBR })
    if (!isValid(d)) {
      // Try english locale for M/d/yyyy
      const dEn = parse(v, fmt, new Date(), { locale: enUS })
      if (isValid(dEn) && dEn.getFullYear() > 1980 && dEn.getFullYear() < 2100)
        return dEn
    }
    if (isValid(d) && d.getFullYear() > 1980 && d.getFullYear() < 2100) return d
  }
  return null
}

const getFieldFromHeader = (header: string): string | null => {
  const h = header.toLowerCase()
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => h === alias || h.includes(alias))) {
      // Prevent "Data Pagamento" from matching "Data" alias for "data_venda" excessively
      // if it doesn't match other specific things.
      // However, "Data Venda" is specific.
      return field
    }
  }
  return null
}

type Section = Record<string, number> // field -> colIndex

const analyzeRowForHeaders = (
  row: string[],
): { isHeader: boolean; sections: Section[] } => {
  const sections: Section[] = []
  let currentSection: Section = {}
  let matches = 0

  row.forEach((cell, idx) => {
    if (!cell) return
    const field = getFieldFromHeader(cell)
    if (field) {
      // If field already exists in current section, it means we started a new section side-by-side
      if (currentSection[field] !== undefined) {
        // Push current section if it has enough data to be valid
        if (
          Object.keys(currentSection).length >= 2 &&
          (currentSection['data_venda'] !== undefined ||
            currentSection['carro'] !== undefined)
        ) {
          sections.push(currentSection)
        }
        currentSection = {}
      }
      currentSection[field] = idx
      matches++
    }
  })

  // Push last section
  if (
    Object.keys(currentSection).length >= 2 &&
    (currentSection['data_venda'] !== undefined ||
      currentSection['carro'] !== undefined)
  ) {
    sections.push(currentSection)
  }

  // Heuristic: A row is a header if it has at least 3 recognized columns
  // OR if it defines at least one valid section with mandatory fields
  const isHeader =
    matches >= 3 ||
    sections.some(
      (s) => s['data_venda'] !== undefined && s['carro'] !== undefined,
    )

  return { isHeader, sections: isHeader ? sections : [] }
}

const isStopRow = (row: string[]): boolean => {
  const content = row.join(' ').toLowerCase()
  return (
    content.includes('total') ||
    content.includes('comissões') ||
    content.includes('carros vendidos')
  )
}

export const parseSalesContent = (content: string): ParseResult => {
  const lines = content.split(/\r?\n/)
  const separator = detectSeparator(content)
  const grid = lines.map((line) => splitLine(line, separator))

  const sales: ParsedSale[] = []
  const errors: ImportError[] = []

  let activeSections: Section[] = []

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex]
    const rowNum = rowIndex + 1

    // Skip empty rows
    if (row.every((c) => !c)) continue

    // 1. Check for Headers
    const { isHeader, sections } = analyzeRowForHeaders(row)
    if (isHeader) {
      activeSections = sections
      continue
    }

    // 2. Check for Stop words (Summaries, Titles)
    if (isStopRow(row)) continue

    // 3. Extract Data
    if (activeSections.length > 0) {
      activeSections.forEach((section) => {
        const rawData: any = {}
        let hasContent = false

        // Extract
        for (const [field, colIdx] of Object.entries(section)) {
          const val = row[colIdx]
          if (val) hasContent = true
          rawData[field] = val
        }

        if (!hasContent) return // Empty cells in this section's columns

        // Validate mandatory fields presence (not value validity yet)
        if (!rawData.data_venda || !rawData.carro) {
          errors.push({
            row: rowNum,
            message:
              'Dados incompletos (Data ou Carro faltando na seção identificada)',
            data: rawData,
          })
          return
        }

        // Parse & Normalize
        const date = parseDateStr(rawData.data_venda)
        const commission = parseCurrency(rawData.valor_comissao)

        if (!date) {
          errors.push({
            row: rowNum,
            message: `Data inválida: ${rawData.data_venda}`,
            data: rawData,
          })
          return
        }

        // Normalize Operation Type
        let tipo = 'Venda'
        if (rawData.tipo_operacao) {
          const t = rawData.tipo_operacao.toLowerCase()
          if (t.includes('compra') || t === 'c' || t === 'x' || t === 'sim') {
            tipo = 'Compra'
          }
        } else if (
          section['tipo_operacao'] &&
          grid[rowIndex - 1] &&
          grid[rowIndex - 1][section['tipo_operacao']]?.toLowerCase() ===
            'compra?'
        ) {
          // If header was "Compra?" and value is empty, assume Venda. If value present (checked), Compra.
          // But we already extracted value.
          // Logic moved to normalization above.
        }

        // Normalize Gestauto
        let gestauto = 'Não'
        if (rawData.gestauto) {
          const g = rawData.gestauto.toLowerCase()
          if (['sim', 's', 'yes', 'true', 'x'].includes(g)) gestauto = 'Sim'
        }

        const sale: ParsedSale = {
          data_venda: format(date, 'yyyy-MM-dd'),
          carro: rawData.carro,
          ano_carro: parseInt(rawData.ano_carro?.replace(/\D/g, '')) || 0,
          placa:
            rawData.placa?.toUpperCase().replace(/[^A-Z0-9-]/g, '') || null,
          nome_cliente: rawData.nome_cliente || 'Cliente não informado',
          gestauto: gestauto,
          valor_financiado: parseCurrency(rawData.valor_financiado) || null,
          retorno: rawData.retorno || null,
          tipo_operacao: tipo,
          valor_comissao: commission,
        }

        sales.push(sale)
      })
    }
  }

  return { sales, errors }
}
