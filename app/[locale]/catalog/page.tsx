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

  // Get filter values from URL search params
  const search = searchParams.get('search') || ''
  const categoryFilter = searchParams.get('category') || 'all'
  const stockFilter = searchParams.get('stock') || 'all'
  const flagFilter = searchParams.get('flag') || 'all'
  const sortBy = searchParams.get('sort') || 'newest'

  useEffect(() => {
    loadData()
  }, [categoryFilter])

  async function loadData() {
    setLoading(true)

    if (!supabase) {
      console.error('Supabase client not initialized')
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

      // Load products with category filter if selected
      let query = supabase
        .from('products')
        .select(`
          *,
          media:product_media(*),
          categories:product_categories(category:categories(*))
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      // If category filter is selected, filter by category
      if (categoryFilter !== 'all') {
        const { data: productIds } = await supabase
          .from('product_categories')
          .select('product_id')
          .eq('category_id', categoryFilter)

        if (productIds && productIds.length > 0) {
          const ids = productIds.map(p => p.product_id)
          query = query.in('id', ids)
        } else {
          // No products in this category
          setProducts([])
          setLoading(false)
          return
        }
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading products:', error)
      }

      if (data) {
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  function updateSearchParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '' || (key === 'sort' && value === 'newest')) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/${locale}/catalog?${params.toString()}`, { scroll: false })
  }

  function filterAndSortProducts() {
    let filtered = [...products]

    // Search filter (code, name_uk, name_ru)
    if (search) {
      filtered = filtered.filter((p) => {
        const searchLower = search.toLowerCase()
        return (
          p.code.toLowerCase().includes(searchLower) ||
          p.name_uk.toLowerCase().includes(searchLower) ||
          (p.name_ru && p.name_ru.toLowerCase().includes(searchLower))
        )
      })
    }

    // Stock filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter((p) => p.stock_status === stockFilter)
    }

    // Flag filter (New/Hits/Sale)
    if (flagFilter !== 'all') {
      filtered = filtered.filter((p) => {
        switch (flagFilter) {
          case 'new':
            return p.is_new === true
          case 'hit':
            return p.is_hit === true
          case 'sale':
            return p.is_sale === true
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'code':
          return a.code.localeCompare(b.code)
        case 'price_asc':
          return a.price_retail - b.price_retail
        case 'price_desc':
          return b.price_retail - a.price_retail
        default:
          return 0
      }
    })

    return filtered
  }

  const filteredProducts = filterAndSortProducts()
  const stockStatuses: StockStatus[] = ['in_stock', 'low_stock', 'preorder', 'out_of_stock']

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">{t(locale, 'catalog.title')}</h1>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t(locale, 'catalog.search_placeholder')}
            value={search}
            onChange={(e) => updateSearchParam('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={(value) => updateSearchParam('category', value)}>
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

          {/* Flag Filter */}
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

          {/* Stock Filter */}
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

          {/* Sort */}
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

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/${locale}/product/${product.slug}`}
              className="group"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                {(() => {
                  const primaryMedia = product.media?.find((m) => m.is_primary && m.media_type === 'photo')
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

                {/* Product Flags */}
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
          No products found
        </div>
      )}
    </div>
  )
}
