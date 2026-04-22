'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { Product, StockStatus, Category } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

export default function CatalogPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = params.locale as Locale

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // URL filter state
  const search = searchParams.get('search') || ''
  const categoryFilter = searchParams.get('category') || 'all'
  const categorySlugParam = searchParams.get('category_slug') || ''
  const stockFilter = searchParams.get('stock') || 'all'
  const flagFilter = searchParams.get('flag') || 'all'
  const sortBy = searchParams.get('sort') || 'newest'

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, categorySlugParam])

  async function loadData() {
    setLoading(true)

    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Resolve effective category ID:
      // ?category=<UUID>  takes priority (direct filter)
      // ?category_slug=<slug>  requires a targeted lookup (homepage links)
      let effectiveCategoryId = categoryFilter

      if (effectiveCategoryId === 'all' && categorySlugParam) {
        // Dedicated query — does not depend on the full categories list loading
        const { data: slugCategory, error: slugError } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlugParam)
          .eq('is_active', true)
          .maybeSingle()

        if (!slugError && slugCategory) {
          effectiveCategoryId = slugCategory.id
        } else {
          // Slug not found or DB error — show empty results, not the full catalog
          setProducts([])
          setLoading(false)
          return
        }
      }

      // Optionally: get product IDs for the resolved category
      let productIds: string[] | null = null

      if (effectiveCategoryId !== 'all') {
        const { data: catProducts, error: catError } = await supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_id', effectiveCategoryId)

        if (catError) {
          // On error, show empty results — never fall through to the full catalog
          console.error('Category filter error:', catError)
          setProducts([])
          setLoading(false)
          return
        } else if (catProducts && catProducts.length > 0) {
          productIds = catProducts.map((p: { product_id: string }) => p.product_id)
        } else {
          // Category exists but has no products yet
          setProducts([])
          setLoading(false)
          return
        }
      }

      let query = supabase
        .from('products')
        .select('*, media:product_media(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (productIds && productIds.length > 0) {
        query = query.in('id', productIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading products:', error)
        setProducts([])
      } else {
        setProducts((data || []) as Product[])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  function updateSearchParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '' || (key === 'sort' && value === 'newest')) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    // When the user changes the category dropdown, drop the category_slug param
    if (key === 'category') {
      next.delete('category_slug')
    }
    router.push(`/${locale}/catalog?${next.toString()}`, { scroll: false })
  }

  function filterAndSortProducts() {
    let filtered = [...products]

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name_uk.toLowerCase().includes(q) ||
          (p.name_ru && p.name_ru.toLowerCase().includes(q)),
      )
    }

    if (stockFilter !== 'all') {
      filtered = filtered.filter((p) => p.stock_status === stockFilter)
    }

    if (flagFilter !== 'all') {
      filtered = filtered.filter((p) => {
        if (flagFilter === 'new') return p.is_new === true
        if (flagFilter === 'hit') return p.is_hit === true
        if (flagFilter === 'sale') return p.is_sale === true
        return true
      })
    }

    filtered.sort((a, b) => {
      if (sortBy === 'code') return a.code.localeCompare(b.code)
      if (sortBy === 'price_asc') return a.price_retail - b.price_retail
      if (sortBy === 'price_desc') return b.price_retail - a.price_retail
      // default: newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return filtered
  }

  // Resolve effective category ID for both Select display and label.
  // category_slug (from homepage links) is resolved against loaded categories.
  const resolvedCategoryId = (() => {
    if (categoryFilter !== 'all') return categoryFilter
    if (categorySlugParam && categories.length > 0) {
      const matched = categories.find((c) => c.slug === categorySlugParam)
      return matched ? matched.id : 'all'
    }
    return 'all'
  })()

  // Derive active category label for display
  const activeCategoryLabel = (() => {
    const cat =
      resolvedCategoryId !== 'all' ? categories.find((c) => c.id === resolvedCategoryId) : null
    return cat ? (locale === 'ru' && cat.name_ru ? cat.name_ru : cat.name_uk) : null
  })()

  const filteredProducts = filterAndSortProducts()
  const stockStatuses: StockStatus[] = ['in_stock', 'low_stock', 'preorder', 'out_of_stock']

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-2">{t(locale, 'catalog.title')}</h1>
      {activeCategoryLabel && (
        <p className="text-muted-foreground mb-6">{activeCategoryLabel}</p>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t(locale, 'catalog.search_placeholder')}
            value={search}
            onChange={(e) => updateSearchParam('search', e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Select
            value={resolvedCategoryId}
            onValueChange={(value) => updateSearchParam('category', value)}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t(locale, 'catalog.filter_category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(locale, 'catalog.all_categories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {locale === 'ru' && category.name_ru ? category.name_ru : category.name_uk}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={flagFilter} onValueChange={(value) => updateSearchParam('flag', value)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t(locale, 'catalog.filter_flag')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(locale, 'catalog.all_flags')}</SelectItem>
              <SelectItem value="new">{t(locale, 'catalog.flag_new')}</SelectItem>
              <SelectItem value="hit">{t(locale, 'catalog.flag_hit')}</SelectItem>
              <SelectItem value="sale">{t(locale, 'catalog.flag_sale')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={(value) => updateSearchParam('stock', value)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t(locale, 'catalog.filter_stock')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t(locale, 'catalog.all_stock')}</SelectItem>
              {stockStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(locale, `catalog.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => updateSearchParam('sort', value)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t(locale, 'catalog.sort_by')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t(locale, 'catalog.sort_newest')}</SelectItem>
              <SelectItem value="code">{t(locale, 'catalog.sort_code')}</SelectItem>
              <SelectItem value="price_asc">{t(locale, 'catalog.sort_price_asc')}</SelectItem>
              <SelectItem value="price_desc">{t(locale, 'catalog.sort_price_desc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square animate-pulse rounded-lg bg-gray-200 mb-4" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200 mb-2" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/${locale}/product/${product.slug}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                {(() => {
                  const primaryMedia = product.media?.find(
                    (m) => m.is_primary && m.media_type === 'photo',
                  )
                  const firstMedia = product.media?.find((m) => m.media_type === 'photo')
                  const displayMedia = primaryMedia || firstMedia

                  return displayMedia ? (
                    <Image
                      src={displayMedia.url}
                      alt={locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span className="text-4xl font-bold">{product.code}</span>
                    </div>
                  )
                })()}

                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.is_new && (
                    <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      {t(locale, 'catalog.flag_new')}
                    </span>
                  )}
                  {product.is_hit && (
                    <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      {t(locale, 'catalog.flag_hit')}
                    </span>
                  )}
                  {product.is_sale && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      {t(locale, 'catalog.flag_sale')}
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {t(locale, 'product.code')}: {product.code}
              </p>
              <p className="font-semibold">{formatPrice(product.price_retail)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(locale, `catalog.${product.stock_status}`)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t(locale, 'catalog.no_results')}
        </div>
      )}
    </div>
  )
}
