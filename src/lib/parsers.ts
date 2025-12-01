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
// Order matters: specific aliases should be checked before generic ones to avoid partial matches
const HEADER_ALIASES: Record<string, string[]> = {
  data_venda: ['data venda', 'dt venda', 'data', 'dia', 'date', 'dt'],
  carro: ['carro', 'veiculo', 'modelo', 'descrição', 'descricao', 'car'],
  ano_carro: ['ano car', 'ano modelo', 'ano', 'year'],
  placa: ['placa', 'plate'],
  nome_cliente: [
    'nome cli',
    'nome cliente',
    'cliente',
    'nome',
    'comprador',
    'client',
  ],
  gestauto: ['gestauto', 'garantia'],
  valor_financiado: [
    'valor financiado',
    'vlr financiado',
    'financiado',
    'finan',
    'financed',
  ],
  retorno: ['retorno', 'ret', 'return'],
  tipo_operacao: [
    'tipo operacao',
    'compra/venda',
    'compra?',
    'operacao',
    'tipo',
    'type',
  ],
  valor_comissao: [
    'valor comissao',
    'vlr comissao',
    'comissao',
    'comissão',
    'valor',
    'vlr',
    'lucro',
    'commission',
  ],
}

// Prioritize M/d/yyyy and dd/MM/yyyy as per user story
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
  // Remove R$ and spaces
  const clean = value.toString().replace(/R\$|\s/g, '')
  if (!clean) return 0

  // Handle "46.900,00" (BR) vs "1,234.56" (US)
  if (clean.includes(',') && clean.includes('.')) {
    const lastDot = clean.lastIndexOf('.')
    const lastComma = clean.lastIndexOf(',')
    if (lastDot > lastComma) {
      // US format: 1,234.56
      return parseFloat(clean.replace(/,/g, ''))
    } else {
      // BR format: 1.234,56
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'))
    }
  } else if (clean.includes(',')) {
    // BR format with just comma: 400,00
    return parseFloat(clean.replace(',', '.'))
  }

  return parseFloat(clean) || 0
}

const parseDateStr = (value: string): Date | null => {
  if (!value) return null
  const v = value.trim()
  for (const fmt of DATE_FORMATS) {
    // Try ptBR first
    let d = parse(v, fmt, new Date(), { locale: ptBR })
    if (isValid(d) && d.getFullYear() > 1980 && d.getFullYear() < 2100) return d

    // Try enUS for formats like M/d/yyyy which might be ambiguous in ptBR
    d = parse(v, fmt, new Date(), { locale: enUS })
    if (isValid(d) && d.getFullYear() > 1980 && d.getFullYear() < 2100) return d
  }
  return null
}

const getFieldFromHeader = (header: string): string | null => {
  const h = header.toLowerCase()
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    // Check for exact matches first to avoid ambiguity
    if (aliases.some((alias) => h === alias)) {
      return field
    }
    // Then check includes
    if (aliases.some((alias) => h.includes(alias))) {
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
    content.includes('carros vendidos') ||
    content.includes('resumo')
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

    // 1. Check for Headers (supports multiple tables sequentially or side-by-side)
    const { isHeader, sections } = analyzeRowForHeaders(row)
    if (isHeader) {
      activeSections = sections
      continue
    }

    // 2. Check for Stop words
    if (isStopRow(row)) continue

    // 3. Extract Data
    if (activeSections.length > 0) {
      activeSections.forEach((section) => {
        const rawData: any = {}
        let hasContent = false

        for (const [field, colIdx] of Object.entries(section)) {
          const val = row[colIdx]
          if (val) hasContent = true
          rawData[field] = val
        }

        if (!hasContent) return

        // Validate mandatory fields presence
        if (!rawData.data_venda || !rawData.carro) {
          // Only error if row has content but missing key fields (avoid trailing empty cells errors)
          return
        }

        const date = parseDateStr(rawData.data_venda)
        const commission = parseCurrency(rawData.valor_comissao)
        const year = parseInt(rawData.ano_carro?.replace(/\D/g, '')) || 0

        if (!date) {
          errors.push({
            row: rowNum,
            message: `Data inválida: ${rawData.data_venda}`,
            data: rawData,
          })
          return
        }

        if (year < 1980 || year > new Date().getFullYear() + 1) {
          errors.push({
            row: rowNum,
            message: `Ano inválido: ${rawData.ano_carro}`,
            data: rawData,
          })
          return
        }

        if (commission <= 0) {
          errors.push({
            row: rowNum,
            message: `Valor de comissão inválido ou zerado: ${rawData.valor_comissao}`,
            data: rawData,
          })
          return
        }

        // Normalize Operation Type
        let tipo = 'Venda'
        if (rawData.tipo_operacao) {
          const t = rawData.tipo_operacao.toLowerCase()
          // "Compra", "C", "Sim" (if boolean column), "X"
          if (
            t.includes('compra') ||
            t === 'c' ||
            t === 'x' ||
            t === 'sim' ||
            t === 's' ||
            t === 'yes'
          ) {
            tipo = 'Compra'
          }
        }

        // Normalize Gestauto
        let gestauto = 'Não'
        if (rawData.gestauto) {
          const g = rawData.gestauto.toLowerCase()
          if (['sim', 's', 'yes', 'true', 'x', 'ok'].includes(g))
            gestauto = 'Sim'
        }

        const sale: ParsedSale = {
          data_venda: format(date, 'yyyy-MM-dd'),
          carro: rawData.carro,
          ano_carro: year,
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
