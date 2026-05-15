import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/pricelist-import'

export const runtime = 'nodejs'

type FilterKey = 'all' | 'in_stock' | 'out_of_stock' | 'active' | 'inactive' | 'with_photos' | 'without_photos' | 'missing_desc' | 'missing_retail'
type SortKey   = 'code_asc' | 'code_desc' | 'updated_desc' | 'sort_order'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search   = (searchParams.get('search') ?? '').trim()
  const filter   = (searchParams.get('filter') ?? 'all') as FilterKey
  const sort     = (searchParams.get('sort') ?? 'code_asc') as SortKey
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') ?? '50', 10)))

  try {
    const supabase = getServiceSupabase()
    const from = (page - 1) * pageSize
    const to   = from + pageSize - 1

    // 1. DB-wide stats (parallel)
    const [totalRes, activeRes, inStockRes, outStockRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock_status', 'in_stock'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock_status', 'out_of_stock'),
    ])

    const stats = {
      total:      totalRes.count  ?? 0,
      active:     activeRes.count ?? 0,
      inStock:    inStockRes.count ?? 0,
      outOfStock: outStockRes.count ?? 0,
    }

    // 2. Photo-filter pre-query: collect all product IDs that have at least one media item
    let withPhotoIds: string[] | null = null
    if (filter === 'with_photos' || filter === 'without_photos') {
      const { data: mediaRows } = await supabase
        .from('product_media')
        .select('product_id')
      withPhotoIds = [...new Set((mediaRows ?? []).map((m: any) => m.product_id as string))]
    }

    // 3. Build main products query
    let q = supabase
      .from('products')
      .select(
        'id, code, name_uk, name_ru, slug, price_retail, price_drop, stock_status, is_active, sort_order, updated_at, material_uk, colors_json, description_uk, media:product_media(id)',
        { count: 'exact' }
      )

    // Search across text columns (Supabase OR filter)
    if (search) {
      q = q.or(
        [
          `code.ilike.%${search}%`,
          `name_uk.ilike.%${search}%`,
          `name_ru.ilike.%${search}%`,
          `slug.ilike.%${search}%`,
          `material_uk.ilike.%${search}%`,
        ].join(',')
      )
    }

    // Apply filter
    switch (filter) {
      case 'in_stock':     q = q.eq('stock_status', 'in_stock'); break
      case 'out_of_stock': q = q.eq('stock_status', 'out_of_stock'); break
      case 'active':       q = q.eq('is_active', true); break
      case 'inactive':     q = q.eq('is_active', false); break
      case 'with_photos':
        if (!withPhotoIds || withPhotoIds.length === 0) {
          return NextResponse.json({ products: [], total: 0, stats })
        }
        q = q.in('id', withPhotoIds)
        break
      case 'without_photos': {
        if (!withPhotoIds) break
        if (withPhotoIds.length === 0) break // no photos at all → all qualify, no filter needed
        // Fetch all product IDs, compute complement
        const { data: allProds } = await supabase.from('products').select('id')
        const withSet = new Set(withPhotoIds)
        const withoutIds = (allProds ?? [])
          .map((p: any) => p.id as string)
          .filter(id => !withSet.has(id))
        if (withoutIds.length === 0) {
          return NextResponse.json({ products: [], total: 0, stats })
        }
        q = q.in('id', withoutIds)
        break
      }
      case 'missing_desc':
        q = q.or('description_uk.is.null,description_uk.eq.')
        break
      case 'missing_retail':
        q = q.eq('price_retail', 0)
        break
    }

    // Apply sort
    switch (sort) {
      case 'code_desc':    q = q.order('code', { ascending: false }); break
      case 'updated_desc': q = q.order('updated_at', { ascending: false }); break
      case 'sort_order':   q = q.order('sort_order', { ascending: true }).order('code', { ascending: true }); break
      default:             q = q.order('code', { ascending: true }); break // code_asc
    }

    const { data, count, error } = await q.range(from, to)
    if (error) throw error

    return NextResponse.json({ products: data ?? [], total: count ?? 0, stats })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unexpected error' }, { status: 500 })
  }
}
