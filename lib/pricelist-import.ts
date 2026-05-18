import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface ParsedVariant {
  code: string
  color: string           // clean display text, e.g. "З капучино б/л"
  source_text: string     // raw column B text after code removal
  normalized_key: string  // stable matching key: code|material|colorKey|logo|hardware
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

// ── Variant component extraction ──────────────────────────────────────────────

type MaterialKey = '' | 'z' | 'e' | 'zr' | 'r'
type LogoKey     = '' | 'jl' | 'no-logo'
type HwKey       = '' | 'gold' | 'silver'

interface VariantParts {
  materialKey:     MaterialKey
  materialDisplay: string
  colorKey:        string
  colorDisplay:    string
  logoKey:         LogoKey
  logoDisplay:     string
  hardwareKey:     HwKey
  hardwareDisplay: string
}

// Known color stems → canonical key
const COLOR_MAP: [RegExp, string][] = [
  [/чорн|черн/i,                    'black'],
  [/шоколад/i,                      'choco'],
  [/капучино/i,                     'cappuccino'],
  [/беж/i,                          'beige'],
  [/бордо/i,                        'bordo'],
  [/пудр/i,                         'pudra'],
  [/сір[иій]|сер[иый]/i,            'grey'],
  [/зелен/i,                        'green'],
  [/молоч/i,                        'milk'],
  [/тілесн|телесн/i,                'skin'],
  [/біл[иій]|бел[ыый]/i,            'white'],
  [/рожев/i,                        'rose'],
  [/син[іий]/i,                     'blue'],
  [/конь?як/i,                      'cognac'],
  [/кавов|кофейн/i,                 'coffee'],
  [/олив/i,                         'olive'],
  [/гірчиц|горчиц/i,                'mustard'],
  [/червон|красн/i,                 'red'],
  [/лілов|фіолет/i,                 'purple'],
  [/вишн/i,                         'cherry'],
  [/лаванд/i,                       'lavender'],
  [/бузков/i,                       'lilac'],
  [/гірчич|горчич/i,                'mustard'],
  [/крем/i,                         'cream'],
  [/пісочн|песочн/i,                'sand'],
]

function normalizeColorKey(color: string): string {
  const s = color.toLowerCase().trim()
  if (!s) return ''
  for (const [re, key] of COLOR_MAP) {
    if (re.test(s)) return key
  }
  // Fallback: strip non-word chars, keep first 24 chars
  return s.replace(/[^\wа-яіїєёa-z0-9]/gi, '_').replace(/_+/g, '_').slice(0, 24)
}

// Patterns ordered so compound matches (ЗР) come before simple ones (З, Р)
const MAT_START: [RegExp, MaterialKey, string][] = [
  [/^(зр|замша\s*[-–]?\s*рептил\S*)\s*/i, 'zr', 'ЗР'],
  [/^(замша|з)\s*/i,                       'z',  'З'],
  [/^(екошкір\S*|еко|эко|е)\s*/i,          'e',  'Е'],
  [/^(рептил\S*|р)\s*/i,                   'r',  'Р'],
]

const MAT_ANYWHERE: [RegExp, MaterialKey, string][] = [
  [/замша\s*[-–]?\s*рептил\S*/i, 'zr', 'ЗР'],
  [/замша/i,                      'z',  'З'],
  [/(екошкір\S*|еко|эко)/i,      'e',  'Е'],
  [/рептил\S*/i,                  'r',  'Р'],
]

function extractVariantParts(sourceText: string): VariantParts {
  let rest = sourceText.trim()

  // 1. Material — check start of string first, then anywhere
  let materialKey: MaterialKey = ''
  let materialDisplay = ''

  for (const [re, key, display] of MAT_START) {
    const m = rest.match(re)
    if (m) { materialKey = key; materialDisplay = display; rest = rest.slice(m[0].length); break }
  }

  if (!materialKey) {
    for (const [re, key, display] of MAT_ANYWHERE) {
      if (re.test(rest)) {
        materialKey = key; materialDisplay = display
        rest = rest.replace(re, ' ')
        break
      }
    }
  }

  // 2. Hardware — before logo so "зол.ф JL" parses correctly
  let hardwareKey: HwKey = ''
  let hardwareDisplay = ''

  if (/зол[.\s]?\S*|золот\S+/i.test(rest)) {
    hardwareKey = 'gold'; hardwareDisplay = 'зол.ф'
    rest = rest.replace(/\s*(зол[.\s]?\S*|золот\S+)/gi, ' ')
  } else if (/сріб\S*|сереб\S*/i.test(rest)) {
    hardwareKey = 'silver'; hardwareDisplay = 'сріб'
    rest = rest.replace(/\s*(сріб\S*|сереб\S*)/gi, ' ')
  }

  // 3. Logo
  let logoKey: LogoKey = ''
  let logoDisplay = ''

  if (/\bJL\b/i.test(rest)) {
    logoKey = 'jl'; logoDisplay = 'JL'
    rest = rest.replace(/\s*\bJL\b\s*/gi, ' ')
  } else if (/б\/л|без\s*лог\S*/i.test(rest)) {
    logoKey = 'no-logo'; logoDisplay = 'б/л'
    rest = rest.replace(/\s*(б\/л|без\s*лог\S*)\s*/gi, ' ')
  }

  // 4. Colour = what remains
  const colorDisplay = rest.replace(/\s+/g, ' ').trim()
  const colorKey     = normalizeColorKey(colorDisplay)

  return { materialKey, materialDisplay, colorKey, colorDisplay, logoKey, logoDisplay, hardwareKey, hardwareDisplay }
}

function buildDisplayColor(parts: VariantParts): string {
  const tokens = [
    parts.materialDisplay,
    parts.colorDisplay,
    parts.logoDisplay,
    parts.hardwareDisplay,
  ].filter(Boolean)
  const joined = tokens.join(' ').replace(/\s+/g, ' ').trim()
  return joined || '—'
}

export function buildNormalizedKey(code: string, sourceText: string): string {
  const p = extractVariantParts(sourceText)
  return `${code}|${p.materialKey}|${p.colorKey}|${p.logoKey}|${p.hardwareKey}`
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

    // Raw text after code prefix, before any normalization
    const source_text = rawName.trim().slice(code.length).replace(/^[-–—\s]+/, '').trim()

    const parts         = extractVariantParts(source_text)
    const color         = buildDisplayColor(parts)
    const normalized_key = buildNormalizedKey(code, source_text)

    const quantity   = parseQty(fields[2] ?? '')    // column C
    const price_drop = parsePrice(fields[3] ?? '')  // column D

    variants.push({ code, color, source_text, normalized_key, price_drop, quantity, hasMissingPrice: price_drop === 0 })
  }

  return { variants, skipped }
}

// ── Core import runner ────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

export async function runImportFromVariants(
  rawVariants: ParsedVariant[],
  supabase: SupabaseClient,
): Promise<ImportReport> {
  const errors: string[] = []

  // Ensure every variant has a normalized_key (manual-import path may omit it)
  const variants = rawVariants.map(v => ({
    ...v,
    normalized_key: v.normalized_key || buildNormalizedKey(v.code, v.source_text ?? v.color),
  }))

  // 1. Group by product code
  const grouped = new Map<string, typeof variants>()
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
        // Match by normalized_source_key first, fall back to normalized color text for legacy rows
        const idx = merged.findIndex(c =>
          c.normalized_source_key && v.normalized_key
            ? c.normalized_source_key === v.normalized_key
            : (c.color ?? '').toLowerCase().trim() === (v.color ?? '').toLowerCase().trim()
        )

        if (idx >= 0) {
          merged[idx] = {
            ...merged[idx],
            color:                 v.color,
            source_text:           v.source_text,
            normalized_source_key: v.normalized_key,
            quantity:              v.quantity,
            price_drop:            v.price_drop > 0 ? v.price_drop : (merged[idx].price_drop ?? 0),
            reserved_quantity:     merged[idx].reserved_quantity ?? 0,
          }
          variantsUpdated++
        } else {
          merged.push({
            color:                 v.color,
            source_text:           v.source_text,
            normalized_source_key: v.normalized_key,
            price_retail:          0,
            price_drop:            0,
            quantity:              v.quantity,
            reserved_quantity:     0,
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
        color:                 v.color,
        source_text:           v.source_text,
        normalized_source_key: v.normalized_key,
        price_retail:          0,
        price_drop:            v.price_drop,
        quantity:              v.quantity,
        reserved_quantity:     0,
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
