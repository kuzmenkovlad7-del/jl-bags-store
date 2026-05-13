import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ParsedVariant {
  code: string
  color: string
  price_drop: number
  quantity: number
  hasMissingPrice: boolean
}

export interface ImportReport {
  success: boolean
  totalParsed: number
  productsCreated: number
  productsUpdated: number
  variantsAdded: number
  variantsUpdated: number
  missingPrice: number
  expectedProductsCount: number
  foundProductsCount: number
  activeProductsCount: number
  syncedAt: string
  errors: string[]
}

// ── Supabase (service role) ───────────────────────────────────────────────────

export function getServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server')
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function detectSeparator(text: string): ',' | ';' {
  const firstLine = text.split('\n')[0] ?? ''
  const semis  = (firstLine.match(/;/g)  ?? []).length
  const commas = (firstLine.match(/,/g)  ?? []).length
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

function extractColor(raw: string, code: string): string {
  let s = raw.trim().slice(code.length).trim()
  s = s.replace(/^[-–—\s]+/, '').trim()
  s = s.replace(/\s*\bJL\b\s*/gi, ' ').trim()
  s = s.replace(/\s+/g, ' ').trim()
  return s || '—'
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

export function parseCSV(text: string): { variants: ParsedVariant[]; skipped: number } {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const lines = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const sep = detectSeparator(clean)
  const variants: ParsedVariant[] = []
  let skipped = 0

  for (const line of lines) {
    if (!line.trim()) { skipped++; continue }
    const fields  = parseCSVLine(line, sep)
    const rawName = fields[1] ?? ''  // column B

    if (shouldSkipRow(rawName)) { skipped++; continue }

    const code = extractCode(rawName)
    if (!code) { skipped++; continue }

    const color      = extractColor(rawName, code)
    const quantity   = parseQty(fields[2] ?? '')    // column C
    const price_drop = parsePrice(fields[3] ?? '')  // column D

    variants.push({ code, color, price_drop, quantity, hasMissingPrice: price_drop === 0 })
  }

  return { variants, skipped }
}

// ── Core import runner ────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

function normalizeColor(s: string): string {
  return s.toLowerCase().trim()
}

export async function runImportFromVariants(
  variants: ParsedVariant[],
  supabase: SupabaseClient,
): Promise<ImportReport> {
  const errors: string[] = []

  // 1. Group by code
  const grouped = new Map<string, ParsedVariant[]>()
  for (const v of variants) {
    const list = grouped.get(v.code) ?? []
    list.push(v)
    grouped.set(v.code, list)
  }
  const allCodes = Array.from(grouped.keys())

  // 2. Fetch existing products in chunks of 200
  const existingProducts: any[] = []
  for (const chunk of chunkArray(allCodes, 200)) {
    const { data, error } = await supabase
      .from('products')
      .select('id, code, price_retail, price_drop, colors_json, stock_status')
      .in('code', chunk)
    if (error) errors.push(`Ошибка загрузки: ${error.message}`)
    if (data) existingProducts.push(...data)
  }

  const existingMap = new Map<string, any>()
  for (const p of existingProducts) existingMap.set(p.code as string, p)

  // 3. Build update and insert payloads
  const toUpdate: { id: string; colors_json: any[]; stock_status: string; is_active: boolean }[] = []
  const toInsert: any[] = []
  let variantsAdded   = 0
  let variantsUpdated = 0

  for (const [code, codeVariants] of grouped.entries()) {
    const existing = existingMap.get(code)

    if (existing) {
      const merged: any[] = Array.isArray(existing.colors_json) ? [...existing.colors_json] : []

      for (const v of codeVariants) {
        const idx = merged.findIndex(
          c => normalizeColor(c.color ?? '') === normalizeColor(v.color)
        )
        if (idx >= 0) {
          merged[idx] = {
            ...merged[idx],
            quantity:          v.quantity,
            price_drop:        v.price_drop > 0 ? v.price_drop : (merged[idx].price_drop ?? 0),
            reserved_quantity: merged[idx].reserved_quantity ?? 0,
          }
          variantsUpdated++
        } else {
          merged.push({
            color:             v.color,
            price_retail:      existing.price_retail ?? 0,
            price_drop:        v.price_drop,
            quantity:          v.quantity,
            reserved_quantity: 0,
          })
          variantsAdded++
        }
      }

      const hasStock = merged.some(c => (c.quantity ?? 0) > 0)
      toUpdate.push({ id: existing.id as string, colors_json: merged, stock_status: hasStock ? 'in_stock' : 'out_of_stock', is_active: true })
    } else {
      const dropPrice  = codeVariants.find(v => v.price_drop > 0)?.price_drop ?? 0
      const hasStock   = codeVariants.some(v => v.quantity > 0)
      const colorsJson = codeVariants.map(v => ({
        color: v.color, price_retail: 0, price_drop: v.price_drop,
        quantity: v.quantity, reserved_quantity: 0,
      }))
      variantsAdded += codeVariants.length

      toInsert.push({
        code, name_uk: `Товар ${code}`, name_ru: `Товар ${code}`, slug: code,
        description_uk: '', description_ru: null, material_uk: '', material_ru: null,
        size_text: '', price_retail: 0, price_drop: dropPrice,
        stock_status: hasStock ? 'in_stock' : 'out_of_stock',
        is_active: true, is_new: false, is_hit: false, is_sale: false, sort_order: 0,
        colors_json: colorsJson,
      })
    }
  }

  // 4. Execute updates (20 concurrent)
  let productsUpdated = 0
  for (const chunk of chunkArray(toUpdate, 20)) {
    const results = await Promise.all(
      chunk.map(u =>
        supabase.from('products')
          .update({ colors_json: u.colors_json, stock_status: u.stock_status, is_active: u.is_active })
          .eq('id', u.id)
      )
    )
    for (const { error } of results) {
      if (error) errors.push(`Ошибка обновления: ${error.message}`)
      else productsUpdated++
    }
  }

  // 5. Insert new products (50 per batch)
  let productsCreated = 0
  for (const chunk of chunkArray(toInsert, 50)) {
    const { data, error } = await supabase.from('products').insert(chunk).select('id')
    if (error) errors.push(`Ошибка создания: ${error.message}`)
    else productsCreated += data?.length ?? 0
  }

  // 6. Post-import verification
  let foundProductsCount  = 0
  let activeProductsCount = 0
  for (const chunk of chunkArray(allCodes, 200)) {
    const [total, active] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).in('code', chunk),
      supabase.from('products').select('id', { count: 'exact', head: true }).in('code', chunk).eq('is_active', true),
    ])
    if (!total.error  && total.count  !== null) foundProductsCount  += total.count
    if (!active.error && active.count !== null) activeProductsCount += active.count
  }

  if (foundProductsCount < allCodes.length * 0.5) {
    errors.push(`Верификация: ожидалось ${allCodes.length} кодов, найдено ${foundProductsCount}.`)
  }
  if (activeProductsCount < foundProductsCount * 0.5) {
    errors.push(`Верификация: активных товаров ${activeProductsCount} из ${foundProductsCount}.`)
  }

  return {
    success:               errors.length === 0,
    totalParsed:           variants.length,
    productsCreated,
    productsUpdated,
    variantsAdded,
    variantsUpdated,
    missingPrice:          variants.filter(v => v.hasMissingPrice).length,
    expectedProductsCount: allCodes.length,
    foundProductsCount,
    activeProductsCount,
    syncedAt:              new Date().toISOString(),
    errors,
  }
}
