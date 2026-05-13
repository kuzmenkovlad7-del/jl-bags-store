'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedVariant {
  code: string
  color: string
  price_drop: number
  quantity: number
  rawLine: string
  hasMissingPrice: boolean
}

interface ImportReport {
  totalParsed: number
  rowsSkipped: number
  productsCreated: number
  variantsAdded: number
  variantsUpdated: number
  missingPrice: number
  errors: string[]
}

type ImportState = 'idle' | 'preview' | 'importing' | 'done'

// ── CSV helpers ───────────────────────────────────────────────────────────────

function detectSeparator(text: string): ',' | ';' {
  const firstLine = text.split('\n')[0] ?? ''
  const semis = (firstLine.match(/;/g) ?? []).length
  const commas = (firstLine.match(/,/g) ?? []).length
  return semis > commas ? ';' : ','
}

function parseCSVLine(line: string, sep: ',' | ';'): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function extractCode(raw: string): string | null {
  const m = raw.trim().match(/^(\d{3,5})/)
  return m ? m[1] : null
}

function extractColor(raw: string, code: string): string {
  let s = raw.trim().slice(code.length).trim()
  // Remove leading punctuation / separators
  s = s.replace(/^[-–—\s]+/, '').trim()
  // Remove standalone "JL" anywhere (brand suffix common in this sheet)
  s = s.replace(/\s*\bJL\b\s*/gi, ' ').trim()
  s = s.replace(/\s+/g, ' ').trim()
  return s || '—'
}

function parsePrice(raw: string): number {
  // "245,00 грн" → "245.00" → 245
  const cleaned = raw.replace(/[^\d,.]/g, '').replace(',', '.')
  const val = parseFloat(cleaned)
  return isNaN(val) ? 0 : Math.round(val)
}

function parseQty(raw: string): number {
  const val = parseInt(raw.replace(/[^\d]/g, ''), 10)
  return isNaN(val) ? 0 : val
}

const SKIP_WORDS = ['наименование', 'товар', 'название', 'код', 'артикул', 'итого', 'остаток', 'дропшипинг']
function shouldSkipRow(raw: string): boolean {
  if (!raw || raw.trim() === '' || raw.trim() === '.') return true
  const lower = raw.trim().toLowerCase()
  return SKIP_WORDS.some(w => lower.startsWith(w) || lower === w)
}

function parseCSV(text: string): { variants: ParsedVariant[]; skipped: number } {
  // Strip UTF-8 BOM
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const lines = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const sep = detectSeparator(clean)
  const variants: ParsedVariant[] = []
  let skipped = 0

  for (const line of lines) {
    if (!line.trim()) { skipped++; continue }
    const fields = parseCSVLine(line, sep)
    const rawName = fields[1] ?? ''  // column B (0-indexed)

    if (shouldSkipRow(rawName)) { skipped++; continue }

    const code = extractCode(rawName)
    if (!code) { skipped++; continue }

    const color     = extractColor(rawName, code)
    const quantity  = parseQty(fields[2] ?? '')   // column C
    const price_drop = parsePrice(fields[3] ?? '') // column D

    variants.push({ code, color, price_drop, quantity, rawLine: line, hasMissingPrice: price_drop === 0 })
  }

  return { variants, skipped }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

function normalizeColor(s: string): string {
  return s.toLowerCase().trim()
}

// ── Import runner ─────────────────────────────────────────────────────────────

async function runImport(
  variants: ParsedVariant[],
  setProgress: (n: number) => void,
  setLabel: (s: string) => void,
): Promise<ImportReport> {
  const rep: ImportReport = {
    totalParsed: variants.length,
    rowsSkipped: 0,
    productsCreated: 0,
    variantsAdded: 0,
    variantsUpdated: 0,
    missingPrice: variants.filter(v => v.hasMissingPrice).length,
    errors: [],
  }

  // 1. Group by product code
  setLabel('Группировка данных...')
  const grouped = new Map<string, ParsedVariant[]>()
  for (const v of variants) {
    const list = grouped.get(v.code) ?? []
    list.push(v)
    grouped.set(v.code, list)
  }
  const allCodes = Array.from(grouped.keys())
  setProgress(5)

  // 2. Fetch existing products in chunks of 200
  setLabel(`Загрузка ${allCodes.length} товаров из базы...`)
  const existingProducts: any[] = []
  const codeChunks = chunkArray(allCodes, 200)
  for (let i = 0; i < codeChunks.length; i++) {
    const { data, error } = await supabase
      .from('products')
      .select('id, code, price_retail, price_drop, colors_json, stock_status')
      .in('code', codeChunks[i])
    if (error) rep.errors.push(`Ошибка загрузки (чанк ${i + 1}): ${error.message}`)
    if (data) existingProducts.push(...data)
    setProgress(5 + Math.round(((i + 1) / codeChunks.length) * 25))
  }

  const existingMap = new Map<string, any>()
  for (const p of existingProducts) existingMap.set(p.code as string, p)
  setProgress(30)

  // 3. Build update + insert payloads
  setLabel('Подготовка изменений...')
  const toUpdate: { id: string; colors_json: any[]; stock_status: string }[] = []
  const toInsert: any[] = []

  for (const [code, codeVariants] of grouped.entries()) {
    const existing = existingMap.get(code)

    if (existing) {
      // --- Merge into existing colors_json ---
      const existingColors: any[] = Array.isArray(existing.colors_json) ? [...existing.colors_json] : []

      for (const v of codeVariants) {
        const idx = existingColors.findIndex(
          c => normalizeColor(c.color ?? '') === normalizeColor(v.color)
        )
        if (idx >= 0) {
          existingColors[idx] = {
            ...existingColors[idx],
            quantity:          v.quantity,
            price_drop:        v.price_drop > 0 ? v.price_drop : (existingColors[idx].price_drop ?? 0),
            reserved_quantity: existingColors[idx].reserved_quantity ?? 0,
          }
          rep.variantsUpdated++
        } else {
          existingColors.push({
            color:             v.color,
            price_retail:      existing.price_retail ?? 0,
            price_drop:        v.price_drop,
            quantity:          v.quantity,
            reserved_quantity: 0,
          })
          rep.variantsAdded++
        }
      }

      const hasStock = existingColors.some(c => (c.quantity ?? 0) > 0)
      toUpdate.push({
        id:           existing.id as string,
        colors_json:  existingColors,
        stock_status: hasStock ? 'in_stock' : 'out_of_stock',
      })
    } else {
      // --- Create new minimal product ---
      const dropPrice  = codeVariants.find(v => v.price_drop > 0)?.price_drop ?? 0
      const hasStock   = codeVariants.some(v => v.quantity > 0)
      const colorsJson = codeVariants.map(v => ({
        color:             v.color,
        price_retail:      0,
        price_drop:        v.price_drop,
        quantity:          v.quantity,
        reserved_quantity: 0,
      }))
      rep.productsCreated++
      rep.variantsAdded += codeVariants.length

      toInsert.push({
        code,
        name_uk:        `Товар ${code}`,
        name_ru:        `Товар ${code}`,
        slug:           code,
        description_uk: '',
        description_ru: null,
        material_uk:    '',
        material_ru:    null,
        size_text:      '',
        price_retail:   0,
        price_drop:     dropPrice,
        stock_status:   hasStock ? 'in_stock' : 'out_of_stock',
        is_active:      true,
        is_new:         false,
        is_hit:         false,
        is_sale:        false,
        sort_order:     0,
        colors_json:    colorsJson,
      })
    }
  }
  setProgress(40)

  // 4. Execute updates in batches of 20 concurrent
  if (toUpdate.length > 0) {
    const updateChunks = chunkArray(toUpdate, 20)
    for (let i = 0; i < updateChunks.length; i++) {
      await Promise.all(
        updateChunks[i].map(u =>
          supabase
            .from('products')
            .update({ colors_json: u.colors_json, stock_status: u.stock_status })
            .eq('id', u.id)
        )
      )
      setProgress(40 + Math.round(((i + 1) / updateChunks.length) * 40))
      setLabel(`Обновление товаров... ${Math.min((i + 1) * 20, toUpdate.length)}/${toUpdate.length}`)
    }
  }
  setProgress(80)

  // 5. Insert new products in batches of 50
  if (toInsert.length > 0) {
    setLabel(`Создание ${toInsert.length} новых товаров...`)
    const insertChunks = chunkArray(toInsert, 50)
    for (let i = 0; i < insertChunks.length; i++) {
      const { error } = await supabase.from('products').insert(insertChunks[i])
      if (error) rep.errors.push(`Ошибка вставки: ${error.message}`)
      setProgress(80 + Math.round(((i + 1) / insertChunks.length) * 18))
    }
  }

  setProgress(100)
  setLabel('Готово!')
  return rep
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvText, setCsvText]         = useState('')
  const [state, setState]             = useState<ImportState>('idle')
  const [parsedVariants, setParsed]   = useState<ParsedVariant[]>([])
  const [skippedCount, setSkipped]    = useState(0)
  const [progress, setProgress]       = useState(0)
  const [progressLabel, setLabel]     = useState('')
  const [report, setReport]           = useState<ImportReport | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCsvText((ev.target?.result as string) ?? '')
    reader.readAsText(file, 'utf-8')
  }

  function handleParse() {
    if (!csvText.trim()) return
    const { variants, skipped } = parseCSV(csvText)
    setParsed(variants)
    setSkipped(skipped)
    setState('preview')
  }

  async function handleImport() {
    setState('importing')
    setProgress(0)
    try {
      const rep = await runImport(parsedVariants, setProgress, setLabel)
      setReport(rep)
    } catch (err: any) {
      setReport({
        totalParsed: parsedVariants.length,
        rowsSkipped: skippedCount,
        productsCreated: 0,
        variantsAdded: 0,
        variantsUpdated: 0,
        missingPrice: 0,
        errors: [`Критическая ошибка: ${err.message}`],
      })
    }
    setState('done')
  }

  function handleReset() {
    setState('idle')
    setCsvText('')
    setReport(null)
    setParsed([])
    setSkipped(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Done state ───────────────────────────────────────────────────────────
  if (state === 'done' && report) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-lg space-y-5">
          <div className="flex items-center gap-3">
            {report.errors.length === 0
              ? <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              : <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />}
            <h2 className="text-lg font-semibold">
              {report.errors.length === 0 ? 'Импорт завершён' : 'Импорт завершён с ошибками'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 border rounded-lg p-4 text-sm">
            <span className="text-muted-foreground">Строк разобрано</span>
            <span className="font-medium text-right">{report.totalParsed}</span>
            <span className="text-muted-foreground">Строк пропущено</span>
            <span className="font-medium text-right">{report.rowsSkipped}</span>
            <span className="text-muted-foreground">Товаров создано</span>
            <span className="font-medium text-right text-blue-600">{report.productsCreated}</span>
            <span className="text-muted-foreground">Вариантов добавлено</span>
            <span className="font-medium text-right text-blue-600">{report.variantsAdded}</span>
            <span className="text-muted-foreground">Вариантов обновлено</span>
            <span className="font-medium text-right text-green-600">{report.variantsUpdated}</span>
            <span className="text-muted-foreground">Строк без цены</span>
            <span className={`font-medium text-right ${report.missingPrice > 0 ? 'text-yellow-600' : ''}`}>
              {report.missingPrice}
            </span>
          </div>

          {report.errors.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50 text-sm">
              <p className="font-semibold text-red-700 mb-2">Ошибки ({report.errors.length})</p>
              <ul className="space-y-1 text-xs text-red-600">
                {report.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                {report.errors.length > 10 && (
                  <li className="text-red-400">...и ещё {report.errors.length - 10}</li>
                )}
              </ul>
            </div>
          )}

          <Button onClick={handleReset} className="w-full sm:w-auto">
            Новый импорт
          </Button>
        </div>
      </div>
    )
  }

  // ── Importing state ───────────────────────────────────────────────────────
  if (state === 'importing') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
            <span className="text-sm font-medium">{progressLabel || 'Инициализация...'}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-sm text-muted-foreground">{progress}%</p>
        </div>
      </div>
    )
  }

  // ── Preview state ─────────────────────────────────────────────────────────
  if (state === 'preview') {
    const uniqueCodes  = new Set(parsedVariants.map(v => v.code)).size
    const missingPrice = parsedVariants.filter(v => v.hasMissingPrice).length
    const sample       = parsedVariants.slice(0, 10)

    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-5">
          <h2 className="font-semibold text-lg">Предпросмотр данных</h2>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { val: parsedVariants.length, label: 'строк разобрано', color: '' },
              { val: uniqueCodes,           label: 'уникальных кодов', color: '' },
              { val: skippedCount,          label: 'строк пропущено',  color: '' },
              { val: missingPrice,          label: 'без цены',         color: missingPrice > 0 ? 'text-yellow-600' : 'text-green-600' },
            ].map(({ val, label, color }) => (
              <div key={label} className="border rounded-lg p-3">
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Sample rows */}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Код</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Цвет/вариант</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-500">К-сть</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-500">Цена дроп</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sample.map((v, i) => (
                  <tr key={i} className={v.hasMissingPrice ? 'bg-yellow-50' : ''}>
                    <td className="px-3 py-1.5 font-mono font-semibold">{v.code}</td>
                    <td className="px-3 py-1.5">{v.color}</td>
                    <td className="px-3 py-1.5 text-right">{v.quantity}</td>
                    <td className="px-3 py-1.5 text-right">
                      {v.price_drop > 0
                        ? `${v.price_drop} грн`
                        : <span className="text-yellow-600 font-medium">—</span>}
                    </td>
                  </tr>
                ))}
                {parsedVariants.length > 10 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-center text-muted-foreground italic">
                      ...и ещё {parsedVariants.length - 10} строк
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {missingPrice > 0 && (
            <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                {missingPrice} строк без цены дроп. Для новых вариантов будет установлена цена 0.
                Для существующих вариантов сохранится прежняя цена.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleImport} className="sm:flex-none">
              Запустить импорт ({parsedVariants.length} строк)
            </Button>
            <Button variant="outline" onClick={() => setState('idle')}>
              Назад
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Idle state ────────────────────────────────────────────────────────────
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-6">

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
          <p className="font-semibold text-blue-800">
            Google Sheets → Файл → Скачать → CSV
          </p>
          <p className="text-blue-700 font-medium">Ожидаемые колонки:</p>
          <ul className="text-blue-700 space-y-1 ml-1">
            <li><span className="font-semibold">B</span> — товар/цвет, например:{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">5317 - Е чорний</code>
              {' '}или{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">5145 шоколад JL</code>
            </li>
            <li><span className="font-semibold">C</span> — остаток (количество)</li>
            <li><span className="font-semibold">D</span> — цена дроп, например:{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">245,00 грн</code>
            </li>
            <li><span className="font-semibold">E</span> — единица (шт) — не используется</li>
          </ul>
          <p className="text-blue-600 text-xs">
            Шапка, пустые строки и строки без кода автоматически пропускаются.
          </p>
        </div>

        {/* File upload */}
        <div>
          <Label className="mb-2 block font-medium">Загрузить файл CSV</Label>
          <div
            role="button"
            tabIndex={0}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
            onClick={() => fileRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 font-medium">Нажмите для выбора файла</p>
            <p className="text-xs text-gray-400 mt-1">.csv · .txt · кодировка UTF-8</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          {csvText && (
            <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Файл загружен — {csvText.split('\n').length.toLocaleString()} строк
            </p>
          )}
        </div>

        {/* Paste textarea */}
        <div>
          <Label className="mb-2 block font-medium">Или вставьте CSV-текст напрямую</Label>
          <textarea
            className="w-full h-36 border rounded-md p-3 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring bg-gray-50"
            placeholder={`,5317 - Е чорний,25,"245,00 грн",шт\n,5317 - Е шоколад,12,"245,00 грн",шт\n,5145 шоколад JL,8,"310,00 грн",шт`}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
        </div>

        <Button
          onClick={handleParse}
          disabled={!csvText.trim()}
          className="w-full sm:w-auto"
        >
          <FileText className="h-4 w-4 mr-2" />
          Разобрать CSV
        </Button>
      </div>
    </div>
  )
}
