'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, Copy, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice } from '@/lib/utils'
import { PriceListProduct, PriceListColor, PriceListCategory } from './page'

// ─── Stock status badge ──────────────────────────────────────────────────────

const STOCK_LABELS: Record<string, { label: string; cls: string }> = {
  in_stock:     { label: 'В наявності',       cls: 'bg-green-100 text-green-800' },
  low_stock:    { label: 'Закінчується',       cls: 'bg-yellow-100 text-yellow-800' },
  preorder:     { label: 'Під замовлення',     cls: 'bg-blue-100 text-blue-800' },
  out_of_stock: { label: 'Немає',              cls: 'bg-red-100 text-red-800' },
}

function StockBadge({ status }: { status: string }) {
  const { label, cls } = STOCK_LABELS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

// ─── Copy code button ────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API not available
    }
  }

  return (
    <button
      onClick={handleCopy}
      title="Скопіювати код"
      className="ml-1 inline-flex items-center justify-center rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPrimaryImage(media: PriceListProduct['media']): string | null {
  const primary = media.find(m => m.is_primary && m.media_type === 'photo')
  const first   = media.find(m => m.media_type === 'photo')
  return (primary ?? first)?.url ?? null
}

function formatColors(colors: PriceListColor[]): string {
  if (!colors.length) return '—'
  return colors.map(c => c.color).join(', ')
}

function formatColorPrices(colors: PriceListColor[]): React.ReactNode {
  if (!colors.length) return <span className="text-gray-400 text-xs">—</span>
  return (
    <div className="space-y-0.5">
      {colors.map((c, i) => (
        <div key={i} className="text-xs leading-snug">
          <span className="text-gray-700">{c.color}</span>
          <span className="text-gray-400 mx-1">·</span>
          <span className="font-medium text-gray-900">{formatPrice(c.price_drop)}</span>
          <span className="text-gray-400 text-[10px] ml-1">/ {formatPrice(c.price_retail)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  products: PriceListProduct[]
}

export function PriceListClient({ products }: Props) {
  const [search, setSearch]   = useState('')
  const [stockFilter, setStockFilter]     = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Derive unique categories from product list
  const allCategories = useMemo<PriceListCategory[]>(() => {
    const seen = new Map<string, PriceListCategory>()
    for (const p of products) {
      for (const cat of p.categories) {
        if (!seen.has(cat.id)) seen.set(cat.id, cat)
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name_uk.localeCompare(b.name_uk))
  }, [products])

  // Apply all filters
  const filtered = useMemo<PriceListProduct[]>(() => {
    let result = products

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(p =>
        p.code.toLowerCase().includes(q) ||
        p.name_uk.toLowerCase().includes(q) ||
        (p.name_ru?.toLowerCase().includes(q) ?? false)
      )
    }

    if (stockFilter !== 'all') {
      result = result.filter(p => p.stock_status === stockFilter)
    }

    if (categoryFilter !== 'all') {
      result = result.filter(p => p.categories.some(c => c.id === categoryFilter))
    }

    return result
  }, [products, search, stockFilter, categoryFilter])

  const hasFilters = search || stockFilter !== 'all' || categoryFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStockFilter('all')
    setCategoryFilter('all')
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Пошук за кодом або назвою..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {/* Category filter */}
        {allCategories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-white">
              <SelectValue placeholder="Категорія" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі категорії</SelectItem>
              {allCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name_uk}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Stock filter */}
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white">
            <SelectValue placeholder="Наявність" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Вся наявність</SelectItem>
            <SelectItem value="in_stock">В наявності</SelectItem>
            <SelectItem value="low_stock">Закінчується</SelectItem>
            <SelectItem value="preorder">Під замовлення</SelectItem>
            <SelectItem value="out_of_stock">Немає</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            <X className="h-3.5 w-3.5" />
            Скинути
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-sm text-gray-500">
        {filtered.length === products.length
          ? `${products.length} товарів`
          : `${filtered.length} з ${products.length} товарів`}
      </p>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-lg border">
          Товарів не знайдено
        </div>
      )}

      {/* ── Desktop table ────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="hidden md:block overflow-hidden rounded-lg bg-white shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-3 w-12"></th>
                  <th className="px-3 py-3">Код</th>
                  <th className="px-3 py-3">Назва</th>
                  <th className="px-3 py-3">Роздріб</th>
                  <th className="px-3 py-3">Дроп</th>
                  <th className="px-3 py-3">Кольори / ціна дроп</th>
                  <th className="px-3 py-3">Наявність</th>
                  <th className="px-3 py-3">Категорія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(product => {
                  const imgUrl = getPrimaryImage(product.media)
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      {/* Thumbnail */}
                      <td className="px-3 py-2.5">
                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {imgUrl ? (
                            <Image
                              src={imgUrl}
                              alt={product.name_uk}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full text-[9px] font-bold text-gray-400">
                              {product.code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center">
                          <span className="font-mono font-semibold text-gray-900">{product.code}</span>
                          <CopyButton text={product.code} />
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-900 leading-snug">{product.name_uk}</p>
                        {product.material_uk && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{product.material_uk}</p>
                        )}
                      </td>

                      {/* Retail price */}
                      <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-700">
                        {formatPrice(product.price_retail)}
                      </td>

                      {/* Drop price */}
                      <td className="px-3 py-2.5 whitespace-nowrap font-bold text-gray-900">
                        {formatPrice(product.price_drop)}
                      </td>

                      {/* Colors with per-color drop price */}
                      <td className="px-3 py-2.5 max-w-[200px]">
                        {formatColorPrices(product.colors_json)}
                      </td>

                      {/* Stock status */}
                      <td className="px-3 py-2.5">
                        <StockBadge status={product.stock_status} />
                      </td>

                      {/* Categories */}
                      <td className="px-3 py-2.5">
                        {product.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.categories.map(cat => (
                              <span
                                key={cat.id}
                                className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                              >
                                {cat.name_uk}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Mobile cards ─────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map(product => {
            const imgUrl = getPrimaryImage(product.media)
            return (
              <div key={product.id} className="bg-white rounded-lg border shadow-sm p-3">
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    {imgUrl ? (
                      <Image
                        src={imgUrl}
                        alt={product.name_uk}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xs font-bold text-gray-400">
                        {product.code}
                      </span>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-mono font-bold text-gray-900 text-sm">{product.code}</span>
                      <CopyButton text={product.code} />
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-snug truncate">{product.name_uk}</p>
                    {product.material_uk && (
                      <p className="text-xs text-gray-400 leading-snug mt-0.5">{product.material_uk}</p>
                    )}
                  </div>
                </div>

                {/* Prices row */}
                <div className="mt-2.5 flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 block">Роздріб</span>
                    <span className="font-medium text-gray-700">{formatPrice(product.price_retail)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Дроп</span>
                    <span className="font-bold text-gray-900">{formatPrice(product.price_drop)}</span>
                  </div>
                  <div className="ml-auto">
                    <StockBadge status={product.stock_status} />
                  </div>
                </div>

                {/* Colors */}
                {product.colors_json.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1">Кольори</p>
                    <div className="space-y-0.5">
                      {product.colors_json.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{c.color}</span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(c.price_drop)}
                            <span className="text-gray-400 font-normal ml-1">/ {formatPrice(c.price_retail)}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {product.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {product.categories.map(cat => (
                      <span
                        key={cat.id}
                        className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                      >
                        {cat.name_uk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
