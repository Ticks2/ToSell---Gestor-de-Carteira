import { parse, isValid, format, addDays } from 'date-fns'
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

// Expanded aliases with prioritization logic handled in getFieldFromHeader
const HEADER_ALIASES: Record<string, string[]> = {
  data_venda: [
    'data venda',
    'dt venda',
    'data',
    'date',
    'dt',
    'dia',
    'dta',
    'venda',
  ],
  carro: [
    'carro',
    'veiculo',
    'veículo',
    'modelo',
    'descrição',
    'descricao',
    'car',
    'vehicle',
    'desc',
  ],
  ano_carro: ['ano modelo', 'ano car', 'ano', 'year', 'anomodelo', 'model'],
  placa: ['placa', 'plate', 'placas'],
  nome_cliente: [
    'nome cliente',
    'nome cli',
    'cliente',
    'comprador',
    'nome',
    'client',
    'customer',
  ],
  gestauto: ['gestauto', 'garantia', 'warranty', 'gest'],
  valor_financiado: [
    'valor financiado',
    'vlr financiado',
    'financiado',
    'finan',
    'financed',
    'amount',
  ],
  retorno: ['retorno', 'ret', 'return', 'banco'],
  tipo_operacao: [
    'tipo operacao',
    'tipo operação',
    'compra/venda',
    'operacao',
    'operação',
    'tipo',
    'type',
    'c/v',
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
    'profit',
    'resultado',
  ],
}

const DATE_FORMATS = [
  'dd/MM/yyyy', // 16/01/2025
  'dd/MM/yy', // 16/01/25
  'd/M/yyyy', // 16/1/2025
  'M/d/yyyy', // 12/7/2025
  'MM/dd/yyyy', // 01/16/2025
  'yyyy-MM-dd', // 2025-01-16
  'dd-MM-yyyy', // 16-01-2025
  'dd.MM.yyyy', // 16.01.2025
]

// Flatten aliases for smarter matching (longest aliases first to avoid partial matches like 'Modelo' matching 'Ano Modelo')
const SORTED_ALIASES = Object.entries(HEADER_ALIASES)
  .flatMap(([field, aliases]) => aliases.map((alias) => ({ field, alias })))
  .sort((a, b) => b.alias.length - a.alias.length)

const detectSeparator = (text: string): string => {
  const lines = text.split(/\r?\n/).slice(0, 10)
  let semiCount = 0
  let commaCount = 0
  let tabCount = 0
  let pipeCount = 0

  lines.forEach((l) => {
    semiCount += (l.match(/;/g) || []).length
    commaCount += (l.match(/,/g) || []).length
    tabCount += (l.match(/\t/g) || []).length
    pipeCount += (l.match(/\|/g) || []).length
  })

  if (tabCount > semiCount && tabCount > commaCount && tabCount > pipeCount)
    return '\t'
  if (semiCount > commaCount && semiCount > pipeCount) return ';'
  if (pipeCount > commaCount) return '|'
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
  const clean = value.toString().replace(/R\$|\s|Rs/g, '')
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

  // Handle Excel Serial Date (e.g., 45321)
  if (/^\d{5}$/.test(v)) {
    const serial = parseInt(v)
    // Excel base date is Dec 30, 1899
    if (serial > 20000 && serial < 60000) {
      try {
        const date = addDays(new Date(1899, 11, 30), serial)
        if (isValid(date)) return date
      } catch (e) {
        // ignore
      }
    }
  }

  for (const fmt of DATE_FORMATS) {
    // Try ptBR first
    let d = parse(v, fmt, new Date(), { locale: ptBR })
    if (isValid(d) && d.getFullYear() > 1980 && d.getFullYear() < 2100) return d

    // Try enUS
    d = parse(v, fmt, new Date(), { locale: enUS })
    if (isValid(d) && d.getFullYear() > 1980 && d.getFullYear() < 2100) return d
  }
  return null
}

const parseYear = (value: string): number => {
  if (!value) return 0
  const clean = value.toString().trim()

  // Try to find a 4-digit year starting with 19 or 20
  const fourDigitMatch = clean.match(/\b(19|20)\d{2}\b/)
  if (fourDigitMatch) return parseInt(fourDigitMatch[0])

  // Handle "23/24", "2023/2024" patterns often found in car models
  if (clean.includes('/')) {
    const parts = clean.split('/')
    const lastPart = parts[parts.length - 1].trim()
    if (lastPart.length === 4) return parseInt(lastPart)
    if (lastPart.length === 2) return 2000 + parseInt(lastPart)
  }

  // Fallback: extracts only digits
  const digits = clean.replace(/\D/g, '')
  if (digits.length === 4) return parseInt(digits)
  if (digits.length === 2) return 2000 + parseInt(digits)

  return 0
}

const getFieldFromHeader = (header: string): string | null => {
  if (!header) return null
  const h = header.toLowerCase().trim()

  // Use sorted aliases to prioritize longer matches first
  // e.g. "Ano Modelo" matches 'ano_carro' alias "ano modelo" BEFORE it matches 'carro' alias "modelo"
  for (const { field, alias } of SORTED_ALIASES) {
    if (h === alias) return field // Exact match
  }
  for (const { field, alias } of SORTED_ALIASES) {
    if (h.includes(alias)) return field // Partial match
  }

  return null
}

type Section = Record<string, number> // field -> colIndex

const analyzeRowForHeaders = (
  row: string[],
): { isHeader: boolean; sections: Section[] } => {
  const sections: Section[] = []
  let currentSection: Section = {}
  let foundFieldsInRow = 0

  row.forEach((cell, idx) => {
    const field = getFieldFromHeader(cell)
    if (field) {
      foundFieldsInRow++

      // If this field already exists in the current section, or if we have a gap that suggests a new table
      // We assume a new table starts if we see a duplicate core field like 'data_venda' or 'carro'
      if (currentSection[field] !== undefined) {
        // Push the previous section if it has minimal required fields
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
    }
  })

  // Push the last section
  if (
    Object.keys(currentSection).length >= 2 &&
    (currentSection['data_venda'] !== undefined ||
      currentSection['carro'] !== undefined)
  ) {
    sections.push(currentSection)
  }

  // Strict header detection: Must have found at least 2 mapped fields in valid sections
  const isHeader = sections.length > 0

  return { isHeader, sections }
}

const isStopRow = (row: string[]): boolean => {
  // Only stop if the FIRST non-empty cell clearly indicates a summary row
  const firstContent = row.find((c) => c.trim().length > 0)?.toLowerCase()
  if (!firstContent) return false

  const stopWords = [
    'total',
    'resumo',
    'quantidade',
    'subtotal',
    'comissões',
    'comissoes',
    'saldo',
    'entradas',
    'saídas',
    'saidas',
    'geral',
    'acumulado',
    'conferência',
    'conferencia',
  ]
  return stopWords.some((w) => firstContent.startsWith(w))
}

export const parseSalesContent = (content: string): ParseResult => {
  const lines = content.split(/\r?\n/)
  const separator = detectSeparator(content)
  const grid = lines.map((line) => splitLine(line, separator))

  const sales: ParsedSale[] = []
  const errors: ImportError[] = []

  let activeSections: Section[] = []
  let hasFoundHeader = false

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex]
    const rowNum = rowIndex + 1

    // Skip empty rows
    if (row.every((c) => !c.trim())) continue

    // 1. Check for Headers
    const { isHeader, sections } = analyzeRowForHeaders(row)
    if (isHeader) {
      // Only replace active sections if the new header row looks richer or valid
      // This prevents a random row with one 'Data' word from breaking the context
      activeSections = sections
      hasFoundHeader = true
      continue
    }

    // If we haven't found a header yet, we can't parse data reliably
    if (!hasFoundHeader) continue

    // 2. Check for Stop words (summary rows)
    if (isStopRow(row)) continue

    // 3. Extract Data
    if (activeSections.length > 0) {
      activeSections.forEach((section) => {
        const rawData: any = {}
        let hasContent = false
        let missingMandatory = false

        // Check mandatory fields first
        if (
          section['data_venda'] === undefined ||
          section['carro'] === undefined
        ) {
          // Incomplete section definition, skip
          return
        }

        for (const [field, colIdx] of Object.entries(section)) {
          const val = row[colIdx]
          if (val && val.trim()) {
            hasContent = true
            rawData[field] = val.trim()
          }
        }

        // If the row is empty in this section's columns, skip
        if (!hasContent) return

        // Basic Validation
        if (!rawData.data_venda || !rawData.carro) {
          // Skip partial rows silently - often artifacts or comments
          return
        }

        const date = parseDateStr(rawData.data_venda)
        const commission = parseCurrency(rawData.valor_comissao)
        const year = parseYear(rawData.ano_carro)

        if (!date) {
          // Don't error immediately if it looks like a non-data row,
          // but if it has a car name, it's likely a sale with bad date
          if (rawData.carro.length > 3) {
            errors.push({
              row: rowNum,
              message: `Data inválida ou ausente: "${rawData.data_venda}"`,
              data: rawData,
            })
          }
          return
        }

        if (year < 1980 || year > new Date().getFullYear() + 1) {
          errors.push({
            row: rowNum,
            message: `Ano inválido: "${rawData.ano_carro}"`,
            data: rawData,
          })
          return
        }

        // Relaxed validation: allow 0 commission (often missing or Purchase/Compra)
        // Negative commissions still flagged as potential errors, though allowed in some contexts, usually data entry error here
        if (commission < 0) {
          errors.push({
            row: rowNum,
            message: `Valor de comissão inválido (negativo): "${rawData.valor_comissao}"`,
            data: rawData,
          })
          return
        }

        // Normalize Operation Type
        let tipo = 'Venda'
        if (rawData.tipo_operacao) {
          const t = rawData.tipo_operacao.toLowerCase()
          if (
            t.includes('compra') ||
            t === 'c' ||
            t === 'x' ||
            t === 'sim' ||
            t === 's'
          ) {
            tipo = 'Compra'
          }
        }

        // Normalize Gestauto
        let gestauto = 'Não'
        if (rawData.gestauto) {
          const g = rawData.gestauto.toLowerCase()
          if (['sim', 's', 'yes', 'true', 'x', 'ok', 'com'].includes(g))
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
          valor_comissao: commission, // Now can be 0
        }

        sales.push(sale)
      })
    }
  }

  return { sales, errors }
}
