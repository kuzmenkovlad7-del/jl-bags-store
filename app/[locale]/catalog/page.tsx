'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { Product, StockStatus } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { useParams } from 'next/navigation'

export default function CatalogPage() {
  const params = useParams()
  const locale = params.locale as Locale
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, search, stockFilter, sortBy])

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, media:product_media(*)')
      .eq('is_active', true)

    if (data) {
      setProducts(data)
    }
    setLoading(false)
  }

  function filterAndSortProducts() {
    let filtered = [...products]

    if (search) {
      filtered = filtered.filter((p) =>
        p.code.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (stockFilter !== 'all') {
      filtered = filtered.filter((p) => p.stock_status === stockFilter)
    }

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

    setFilteredProducts(filtered)
  }

  const stockStatuses: StockStatus[] = ['in_stock', 'low_stock', 'preorder', 'out_of_stock']

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">{t(locale, 'catalog.title')}</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t(locale, 'catalog.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={stockFilter} onValueChange={setStockFilter}>
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

        <Select value={sortBy} onValueChange={setSortBy}>
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
                {product.media && product.media[0] ? (
                  <Image
                    src={product.media[0].url}
                    alt={product.name_uk}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <span className="text-4xl font-bold">{product.code}</span>
                  </div>
                )}
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
