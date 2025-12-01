import { parse, isValid, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
  errors: { row: number; message: string }[]
}

const HEADER_ALIASES: Record<string, string[]> = {
  data_venda: ['data', 'data venda', 'dt venda', 'dia', 'date'],
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
  tipo_operacao: ['tipo', 'operacao', 'tipo operacao', 'compra/venda', 'type'],
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

const parseCurrency = (value: string): number => {
  if (!value) return 0
  const clean = value.toString().replace(/R\$|\s/g, '')
  if (clean.includes(',') && clean.includes('.')) {
    // 1.234,56 or 1,234.56 - assume last separator is decimal
    const lastDot = clean.lastIndexOf('.')
    const lastComma = clean.lastIndexOf(',')
    if (lastDot > lastComma) return parseFloat(clean.replace(/,/g, '')) // 1,234.56
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) // 1.234,56
  } else if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'))
  }
  return parseFloat(clean) || 0
}

const parseDateStr = (value: string): Date | null => {
  if (!value) return null
  const formats = ['dd/MM/yyyy', 'd/M/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy']
  for (const fmt of formats) {
    const d = parse(value.trim(), fmt, new Date(), { locale: ptBR })
    if (isValid(d) && d.getFullYear() > 1900 && d.getFullYear() < 2100) return d
  }
  return null
}

export const parseSalesContent = (content: string): ParseResult => {
  const lines = content.split(/\r?\n/)
  const sales: ParsedSale[] = []
  const errors: { row: number; message: string }[] = []
  let currentMap: Record<number, string> = {}

  lines.forEach((line, index) => {
    const rowNum = index + 1
    const trimmed = line.trim()
    if (!trimmed) return

    // Detect separator
    const sep = trimmed.includes(';')
      ? ';'
      : trimmed.includes('\t')
        ? '\t'
        : ','
    const cols = trimmed
      .split(sep)
      .map((c) => c.trim().replace(/^["']|["']$/g, ''))
    const lowerCols = cols.map((c) => c.toLowerCase())

    // Skip known non-data rows
    if (
      lowerCols.some(
        (c) =>
          c.startsWith('carros vendidos') ||
          c.startsWith('comissões') ||
          c.startsWith('total'),
      )
    ) {
      return
    }

    // Detect Header
    const matchedHeaders: Record<number, string> = {}
    let matchCount = 0
    lowerCols.forEach((col, idx) => {
      for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
        if (aliases.some((alias) => col === alias || col.includes(alias))) {
          matchedHeaders[idx] = field
          matchCount++
          break
        }
      }
    })

    // Threshold to consider it a header row (at least 3 matches, including mandatory ones)
    const isHeader =
      matchCount >= 3 &&
      (Object.values(matchedHeaders).includes('data_venda') ||
        Object.values(matchedHeaders).includes('carro'))

    if (isHeader) {
      currentMap = matchedHeaders
      return
    }

    // If no mapping yet, we can't process
    if (Object.keys(currentMap).length === 0) return

    // Parse Row using currentMap
    const sale: any = {}
    let hasMandatoryData = false

    Object.entries(currentMap).forEach(([colIdx, field]) => {
      const val = cols[parseInt(colIdx)]
      if (val) {
        if (field === 'data_venda') {
          const date = parseDateStr(val)
          if (date) {
            sale[field] = format(date, 'yyyy-MM-dd')
            hasMandatoryData = true
          }
        } else if (
          ['ano_carro', 'valor_financiado', 'valor_comissao'].includes(field)
        ) {
          if (field === 'ano_carro')
            sale[field] = parseInt(val.replace(/\D/g, '')) || 0
          else sale[field] = parseCurrency(val)
        } else {
          sale[field] = val
        }
      }
    })

    if (hasMandatoryData && sale.carro && sale.valor_comissao > 0) {
      // Normalization
      if (!sale.tipo_operacao) sale.tipo_operacao = 'Venda'
      if (sale.tipo_operacao.toLowerCase().includes('compra'))
        sale.tipo_operacao = 'Compra'
      else sale.tipo_operacao = 'Venda'

      if (sale.gestauto)
        sale.gestauto = ['sim', 's', 'yes', 'true'].includes(
          sale.gestauto.toLowerCase(),
        )
          ? 'Sim'
          : 'Não'
      else sale.gestauto = 'Não'

      if (!sale.placa) sale.placa = null
      if (!sale.valor_financiado) sale.valor_financiado = null
      if (!sale.retorno) sale.retorno = null

      sales.push(sale as ParsedSale)
    } else if (hasMandatoryData) {
      // Only log error if it looked like a sale but failed validation
      errors.push({
        row: rowNum,
        message: 'Dados incompletos (Data, Carro ou Comissão faltando)',
      })
    }
  })

  return { sales, errors }
}
