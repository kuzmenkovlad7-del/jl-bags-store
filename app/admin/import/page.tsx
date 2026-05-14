'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, CheckCircle, Loader2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import type { ImportReport } from '@/lib/pricelist-import'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedVariant {
  code: string
  color: string
  source_text: string
  price_drop: number
  quantity: number
  rawLine: string
  hasMissingPrice: boolean
}

type ImportState = 'idle' | 'preview' | 'importing' | 'done'
type SyncState   = 'idle' | 'syncing' | 'done' | 'error'


// ── CSV helpers ───────────────────────────────────────────────────────────────

function detectSeparator(text: string): ',' | ';' {
  const firstLine = text.split('\n')[0] ?? ''
  const semis  = (firstLine.match(/;/g) ?? []).length
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
      fields.push(current.trim()); current = ''
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

function extractSourceText(raw: string, code: string): string {
  return raw.trim().slice(code.length).replace(/^[-–—\s]+/, '').trim()
}

function extractColor(sourceText: string): string {
  // Simple client-side display: normalize whitespace only, keep all tokens for preview
  return sourceText.replace(/\s+/g, ' ').trim() || '—'
}

function parsePrice(raw: string): number {
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
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const lines = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const sep = detectSeparator(clean)
  const variants: ParsedVariant[] = []
  let skipped = 0

  for (const line of lines) {
    if (!line.trim()) { skipped++; continue }
    const fields  = parseCSVLine(line, sep)
    const rawName = fields[1] ?? ''

    if (shouldSkipRow(rawName)) { skipped++; continue }
    const code = extractCode(rawName)
    if (!code) { skipped++; continue }

    const source_text = extractSourceText(rawName, code)
    const color       = extractColor(source_text)
    const quantity    = parseQty(fields[2] ?? '')
    const price_drop  = parsePrice(fields[3] ?? '')
    variants.push({ code, color, source_text, price_drop, quantity, rawLine: line, hasMissingPrice: price_drop === 0 })
  }

  return { variants, skipped }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ── Sync result mini-display ──────────────────────────────────────────────────

function SyncResultCard({ report }: { report: ImportReport }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
      <span className="text-muted-foreground">Строк разобрано</span>
      <span className="font-medium text-right">{report.totalParsed}</span>
      <span className="text-muted-foreground">Товаров обновлено</span>
      <span className="font-medium text-right text-green-700">{report.productsUpdated}</span>
      <span className="text-muted-foreground">Товаров создано</span>
      <span className="font-medium text-right text-blue-600">{report.productsCreated}</span>
      <span className="text-muted-foreground">Вариантов обновлено</span>
      <span className="font-medium text-right text-green-700">{report.variantsUpdated}</span>
      <span className="text-muted-foreground">Вариантов добавлено</span>
      <span className="font-medium text-right text-blue-600">{report.variantsAdded}</span>
      <span className="text-muted-foreground">Без цены</span>
      <span className={`font-medium text-right ${report.missingPrice > 0 ? 'text-yellow-600' : ''}`}>
        {report.missingPrice}
      </span>
      <span className="text-muted-foreground">Активных в БД</span>
      <span className={`font-medium text-right ${report.activeProductsCount >= report.expectedProductsCount * 0.95 ? 'text-green-700' : 'text-red-600'}`}>
        {report.activeProductsCount} / {report.expectedProductsCount}
      </span>
    </div>
  )
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
  const [fatalError, setFatalError]   = useState<string | null>(null)

  // Sync state
  const [syncState, setSyncState]     = useState<SyncState>('idle')
  const [syncReport, setSyncReport]   = useState<ImportReport | null>(null)
  const [syncError, setSyncError]     = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt]   = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)

  // Load last sync result from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jl_last_sync')
      if (saved) {
        const parsed = JSON.parse(saved) as { report: ImportReport; syncedAt: string }
        setSyncReport(parsed.report)
        setLastSyncAt(parsed.syncedAt)
        setSyncState('done')
      }
    } catch {}
  }, [])

  // Simulated progress bar during API calls
  useEffect(() => {
    if (state !== 'importing') return
    let pct = 0
    const id = setInterval(() => {
      pct = Math.min(pct + (pct < 60 ? 2 : pct < 85 ? 0.8 : 0.2), 92)
      setProgress(Math.round(pct))
    }, 400)
    return () => clearInterval(id)
  }, [state])

  useEffect(() => {
    if (syncState !== 'syncing') return
    let pct = 0
    const id = setInterval(() => {
      pct = Math.min(pct + (pct < 60 ? 2 : pct < 85 ? 0.8 : 0.2), 92)
      setSyncProgress(Math.round(pct))
    }, 400)
    return () => clearInterval(id)
  }, [syncState])

  async function handleSync() {
    setSyncState('syncing')
    setSyncProgress(0)
    setSyncError(null)
    setSyncReport(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setSyncError('Сессия истекла — войдите в аккаунт повторно.')
        setSyncState('error')
        return
      }

      const res = await fetch('/api/admin/sync-pricelist', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const json = await res.json()

      if (!res.ok || !json.ok) {
        setSyncError(json.error ?? `Сервер вернул ошибку ${res.status}`)
        setSyncState('error')
        return
      }

      const rep = json.report as ImportReport
      setSyncProgress(100)
      setSyncReport(rep)
      setLastSyncAt(rep.syncedAt)
      setSyncState('done')

      // Persist to localStorage
      try {
        localStorage.setItem('jl_last_sync', JSON.stringify({ report: rep, syncedAt: rep.syncedAt }))
      } catch {}
    } catch (err: any) {
      setSyncError(`Сетевая ошибка: ${err.message}`)
      setSyncState('error')
    }
  }

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
    setLabel('Отправка данных на сервер...')
    setFatalError(null)

    try {
      const res = await fetch('/api/admin/import-pricelist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ variants: parsedVariants }),
      })

      const json = await res.json()

      if (!res.ok || !json.ok) {
        setFatalError(json.error ?? `Сервер вернул ошибку ${res.status}`)
        setState('done')
        setReport(null)
        return
      }

      setProgress(100)
      setLabel('Готово!')
      setReport(json.report as ImportReport)
    } catch (err: any) {
      setFatalError(`Сетевая ошибка: ${err.message}`)
    }

    setState('done')
  }

  function handleReset() {
    setState('idle')
    setCsvText('')
    setReport(null)
    setParsed([])
    setSkipped(0)
    setFatalError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Done state ────────────────────────────────────────────────────────────────
  if (state === 'done') {
    const verifyOk = report &&
      report.foundProductsCount  >= report.expectedProductsCount * 0.95 &&
      report.activeProductsCount >= report.foundProductsCount * 0.95
    const hasErrors = !!fatalError || (report && report.errors.length > 0)

    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-lg space-y-5">

          <div className="flex items-center gap-3">
            {fatalError
              ? <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              : hasErrors
                ? <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                : <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            }
            <h2 className="text-lg font-semibold">
              {fatalError ? 'Импорт не выполнен' : hasErrors ? 'Импорт завершён с ошибками' : 'Импорт завершён успешно'}
            </h2>
          </div>

          {fatalError && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50 text-sm text-red-700">
              {fatalError}
            </div>
          )}

          {report && (
            <>
              <div className="grid grid-cols-2 gap-2 border rounded-lg p-4 text-sm">
                <span className="text-muted-foreground">Строк разобрано</span>
                <span className="font-medium text-right">{report.totalParsed}</span>
                <span className="text-muted-foreground">Товаров обновлено</span>
                <span className="font-medium text-right text-green-700">{report.productsUpdated}</span>
                <span className="text-muted-foreground">Товаров создано</span>
                <span className="font-medium text-right text-blue-600">{report.productsCreated}</span>
                <span className="text-muted-foreground">Вариантов обновлено</span>
                <span className="font-medium text-right text-green-700">{report.variantsUpdated}</span>
                <span className="text-muted-foreground">Вариантов добавлено</span>
                <span className="font-medium text-right text-blue-600">{report.variantsAdded}</span>
                <span className="text-muted-foreground">Строк без цены</span>
                <span className={`font-medium text-right ${report.missingPrice > 0 ? 'text-yellow-600' : ''}`}>
                  {report.missingPrice}
                </span>
              </div>

              <div className={`border rounded-lg p-4 text-sm space-y-1 ${verifyOk ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className={`font-semibold ${verifyOk ? 'text-green-800' : 'text-red-700'}`}>Проверка базы данных</p>
                <p className={verifyOk ? 'text-green-700' : 'text-red-600'}>
                  Ожидалось кодов: <strong>{report.expectedProductsCount}</strong>
                </p>
                <p className={verifyOk ? 'text-green-700' : 'text-red-600'}>
                  Найдено в БД: <strong>{report.foundProductsCount}</strong>
                </p>
                <p className={verifyOk ? 'text-green-700' : 'text-red-600'}>
                  Активных (is_active): <strong>{report.activeProductsCount}</strong>
                </p>
                {!verifyOk && (
                  <p className="text-red-600 font-medium">⚠ Расхождение — проверьте SUPABASE_SERVICE_ROLE_KEY и RLS-политики.</p>
                )}
              </div>

              {report.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50 text-sm">
                  <p className="font-semibold text-red-700 mb-2">Ошибки ({report.errors.length})</p>
                  <ul className="space-y-1 text-xs text-red-600">
                    {report.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    {report.errors.length > 10 && <li className="text-red-400">...и ещё {report.errors.length - 10}</li>}
                  </ul>
                </div>
              )}
            </>
          )}

          <Button onClick={handleReset} className="w-full sm:w-auto">Новый импорт</Button>
        </div>
      </div>
    )
  }

  // ── Importing state ───────────────────────────────────────────────────────────
  if (state === 'importing') {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-lg space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
            <span className="text-sm font-medium">{progressLabel || 'Отправка на сервер...'}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-right text-sm text-muted-foreground">{progress}%</p>
          <p className="text-xs text-gray-400">Для большого прайса (1000+ позиций) это может занять 20–40 секунд.</p>
        </div>
      </div>
    )
  }

  // ── Preview state ─────────────────────────────────────────────────────────────
  if (state === 'preview') {
    const uniqueCodes  = new Set(parsedVariants.map(v => v.code)).size
    const missingPrice = parsedVariants.filter(v => v.hasMissingPrice).length
    const sample       = parsedVariants.slice(0, 10)

    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-5">
          <h2 className="font-semibold text-lg">Предпросмотр данных</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { val: parsedVariants.length, label: 'строк разобрано', color: '' },
              { val: uniqueCodes,           label: 'уникальных кодов', color: '' },
              { val: skippedCount,          label: 'строк пропущено',  color: '' },
              { val: missingPrice,          label: 'без цены', color: missingPrice > 0 ? 'text-yellow-600' : 'text-green-600' },
            ].map(({ val, label, color }) => (
              <div key={label} className="border rounded-lg p-3">
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

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
                      {v.price_drop > 0 ? `${v.price_drop} грн` : <span className="text-yellow-600 font-medium">—</span>}
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
              <span>{missingPrice} строк без цены дроп. Для новых вариантов цена будет 0. Для существующих сохранится прежняя цена.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleImport} className="sm:flex-none">
              Импортировать ({parsedVariants.length} строк, {uniqueCodes} кодов)
            </Button>
            <Button variant="outline" onClick={() => setState('idle')}>Назад</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Idle state ────────────────────────────────────────────────────────────────
  const syncConfigured = true // auth uses Supabase session, no public secret needed

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Импорт прайса</h1>
      <div className="space-y-6 max-w-2xl">

        {/* ── Sync from Google Sheets ────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-base">Синхронизировать прайс</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Загрузить актуальные данные напрямую из Google Sheets
              </p>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncState === 'syncing' || !syncConfigured}
              className="shrink-0"
            >
              {syncState === 'syncing'
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Синхронизация...</>
                : <><RefreshCw className="h-4 w-4 mr-2" />Синхронизировать</>
              }
            </Button>
          </div>


          {/* Sync progress */}
          {syncState === 'syncing' && (
            <div className="space-y-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${syncProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-right">{syncProgress}%</p>
            </div>
          )}

          {/* Sync error */}
          {syncState === 'error' && syncError && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{syncError}</span>
            </div>
          )}

          {/* Last sync result */}
          {(syncState === 'done') && syncReport && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                {syncReport.success
                  ? <CheckCircle className="h-4 w-4 text-green-500" />
                  : <AlertTriangle className="h-4 w-4 text-yellow-500" />
                }
                <span className="text-sm font-medium">
                  {syncReport.success ? 'Синхронизация успешна' : 'Синхронизация с ошибками'}
                </span>
                {lastSyncAt && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDateTime(lastSyncAt)}
                  </span>
                )}
              </div>
              <SyncResultCard report={syncReport} />
              {syncReport.errors.length > 0 && (
                <ul className="text-xs text-red-600 space-y-0.5">
                  {syncReport.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                  {syncReport.errors.length > 5 && <li className="text-red-400">...и ещё {syncReport.errors.length - 5}</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Manual CSV import ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="font-semibold text-base">Ручной импорт CSV</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
            <p className="font-semibold text-blue-800">Google Sheets → Файл → Скачать → CSV</p>
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
            </ul>
            <p className="text-blue-600 text-xs">Шапка, пустые строки и строки без числового кода автоматически пропускаются.</p>
          </div>

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
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            {csvText && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Файл загружен — {csvText.split('\n').length.toLocaleString()} строк
              </p>
            )}
          </div>

          <div>
            <Label className="mb-2 block font-medium">Или вставьте CSV-текст напрямую</Label>
            <textarea
              className="w-full h-36 border rounded-md p-3 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring bg-gray-50"
              placeholder={`,5317 - Е чорний,25,"245,00 грн",шт\n,5317 - Е шоколад,12,"245,00 грн",шт\n,5145 шоколад JL,8,"310,00 грн",шт`}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />
          </div>

          <Button onClick={handleParse} disabled={!csvText.trim()} className="w-full sm:w-auto">
            <FileText className="h-4 w-4 mr-2" />
            Разобрать CSV
          </Button>
        </div>
      </div>
    </div>
  )
}
