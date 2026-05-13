export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Metadata } from 'next'
import { Lock } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { PriceListClient } from './pricelist-client'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

export const metadata: Metadata = {
  title: 'Прайс — JL',
  robots: { index: false, follow: false },
}

export interface PriceListColor {
  color: string
  price_retail: number
  price_drop: number
  quantity?: number
  reserved_quantity?: number
}

export interface PriceListCategory {
  id: string
  slug: string
  name_uk: string
  name_ru: string | null
}

interface PriceListMedia {
  url: string
  is_primary: boolean
  media_type: string
  position: number
}

export interface PriceListProduct {
  id: string
  code: string
  name_uk: string
  name_ru: string | null
  price_retail: number
  price_drop: number
  colors_json: PriceListColor[]
  stock_status: string
  sort_order: number
  material_uk: string
  media: PriceListMedia[]
  categories: PriceListCategory[]
}

interface PageProps {
  searchParams: { key?: string }
}

export default async function PriceListPage({ searchParams }: PageProps) {
  const key = searchParams?.key
  const pricelistKey = process.env.PRICELIST_KEY

  if (!pricelistKey || !key || key !== pricelistKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white rounded-xl shadow p-10 max-w-sm w-full">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
            <Lock className="h-6 w-6 text-gray-500" />
          </div>
          <h1 className="text-lg font-bold mb-2">Доступ обмежено</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Для перегляду прайсу необхідне посилання з ключем доступу.
            Зверніться до менеджера.
          </p>
        </div>
      </div>
    )
  }

  const supabase = getSupabase()

  // Fetch all active products with their primary media
  const { data: rawProducts, error } = await supabase
    .from('products')
    .select(`
      id, code, name_uk, name_ru,
      price_retail, price_drop,
      colors_json, stock_status, sort_order, material_uk,
      media:product_media(url, is_primary, media_type, position)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[pricelist] fetch products error:', error.message)
  }

  const productsRaw: any[] = rawProducts ?? []

  // Debug info — visible in page header until confirmed working
  const debugInfo = {
    returned: productsRaw.length,
    first5codes: productsRaw.slice(0, 5).map((p: any) => p.code as string),
    error: error?.message ?? null,
  }
  console.log('[pricelist] debug:', JSON.stringify(debugInfo))

  // Fetch categories for all loaded products in one query
  const categoryMap = new Map<string, PriceListCategory[]>()

  if (productsRaw.length > 0) {
    const productIds: string[] = productsRaw.map((p: any) => p.id as string)
    const { data: rawPCs } = await supabase
      .from('product_categories')
      .select('product_id, categories(id, slug, name_uk, name_ru)')
      .in('product_id', productIds)

    for (const pc of (rawPCs ?? []) as any[]) {
      if (!pc.categories) continue
      const existing = categoryMap.get(pc.product_id as string) ?? []
      existing.push(pc.categories as PriceListCategory)
      categoryMap.set(pc.product_id as string, existing)
    }
  }

  // Normalise and sort: sort_order ASC, then code ASC
  const products: PriceListProduct[] = productsRaw
    .map((p: any): PriceListProduct => ({
      id: p.id as string,
      code: p.code as string,
      name_uk: p.name_uk as string,
      name_ru: (p.name_ru as string | null) ?? null,
      price_retail: p.price_retail as number,
      price_drop: p.price_drop as number,
      colors_json: Array.isArray(p.colors_json) ? (p.colors_json as PriceListColor[]) : [],
      stock_status: p.stock_status as string,
      sort_order: p.sort_order as number,
      material_uk: p.material_uk as string,
      media: Array.isArray(p.media) ? (p.media as PriceListMedia[]) : [],
      categories: categoryMap.get(p.id as string) ?? [],
    }))
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      return a.code.localeCompare(b.code)
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold leading-none">Прайс JL</h1>
            <p className="text-xs text-gray-400 mt-0.5">{products.length} товарів · оновлюється автоматично</p>
          </div>
        </div>
        {/* Temporary debug banner — remove after confirming correct counts */}
        <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-1.5 text-xs text-yellow-800 font-mono">
          DB returned: {debugInfo.returned} active products
          {debugInfo.error && <span className="text-red-600 ml-2">error: {debugInfo.error}</span>}
          {debugInfo.first5codes.length > 0 && (
            <span className="ml-2">first 5 codes: [{debugInfo.first5codes.join(', ')}]</span>
          )}
        </div>
      </div>

      <div className="container py-6">
        <PriceListClient products={products} />
      </div>
    </div>
  )
}
