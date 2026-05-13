import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ParsedVariant {
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
  errors: string[]
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server')
  return createClient(url, key, { auth: { persistSession: false } })
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

function normalizeColor(s: string): string {
  return s.toLowerCase().trim()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const variants: ParsedVariant[] = body.variants ?? []

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ ok: false, error: 'variants array is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const errors: string[] = []

    // 1. Group by product code
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
    let variantsAdded = 0
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
              // preserve existing price if CSV has no price for this row
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
        toUpdate.push({
          id:           existing.id as string,
          colors_json:  merged,
          stock_status: hasStock ? 'in_stock' : 'out_of_stock',
          is_active:    true,
        })
      } else {
        const dropPrice  = codeVariants.find(v => v.price_drop > 0)?.price_drop ?? 0
        const hasStock   = codeVariants.some(v => v.quantity > 0)
        const colorsJson = codeVariants.map(v => ({
          color:             v.color,
          price_retail:      0,
          price_drop:        v.price_drop,
          quantity:          v.quantity,
          reserved_quantity: 0,
        }))
        variantsAdded += codeVariants.length

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

    // 4. Execute updates (20 concurrent)
    let productsUpdated = 0
    for (const chunk of chunkArray(toUpdate, 20)) {
      const results = await Promise.all(
        chunk.map(u =>
          supabase
            .from('products')
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

    // 6. Post-import verification — query back how many codes exist and are active
    let foundProductsCount = 0
    let activeProductsCount = 0
    for (const chunk of chunkArray(allCodes, 200)) {
      const [total, active] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .in('code', chunk),
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .in('code', chunk)
          .eq('is_active', true),
      ])
      if (!total.error && total.count !== null) foundProductsCount += total.count
      if (!active.error && active.count !== null) activeProductsCount += active.count
    }

    if (foundProductsCount < allCodes.length * 0.5) {
      errors.push(
        `Верификация: ожидалось ${allCodes.length} кодов в БД, найдено ${foundProductsCount}. Возможна проблема с записью.`
      )
    }
    if (activeProductsCount < foundProductsCount * 0.5) {
      errors.push(
        `Верификация: найдено ${foundProductsCount} товаров, но активных (is_active=true) только ${activeProductsCount}. Прайс-лист не обновится.`
      )
    }

    const report: ImportReport = {
      success: errors.length === 0,
      totalParsed:           variants.length,
      productsCreated,
      productsUpdated,
      variantsAdded,
      variantsUpdated,
      missingPrice:          variants.filter(v => v.hasMissingPrice).length,
      expectedProductsCount: allCodes.length,
      foundProductsCount,
      activeProductsCount,
      errors,
    }

    return NextResponse.json({ ok: true, report })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unexpected error' },
      { status: 500 }
    )
  }
}
