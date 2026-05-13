'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Search, Copy, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPrice } from '@/lib/utils'
import { PriceListProduct, PriceListCategory } from './page'

// ─── Flat row type (one per color variant) ───────────────────────────────────

interface PriceListRow {
  // product identity
  productId: string
  code: string
  name_uk: string
  name_ru: string | null
  stock_status: string
  material_uk: string
  primaryImageUrl: string | null
  categories: PriceListCategory[]
  // variant fields
  color: string
  price_retail: number
  price_drop: number
  quantity: number
  reserved_quantity: number
  available: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPrimaryImage(media: PriceListProduct['media']): string | null {
  const primary = media.find(m => m.is_primary && m.media_type === 'photo')
  const first   = media.find(m => m.media_type === 'photo')
  return (primary ?? first)?.url ?? null
}

// ─── Stock badge ─────────────────────────────────────────────────────────────

const STOCK_LABELS: Record<string, { label: string; cls: string }> = {
  in_stock:     { label: 'В наявності',   cls: 'bg-green-100 text-green-800' },
  low_stock:    { label: 'Закінчується',  cls: 'bg-yellow-100 text-yellow-800' },
  preorder:     { label: 'Під замовлення',cls: 'bg-blue-100 text-blue-800' },
  out_of_stock: { label: 'Немає',         cls: 'bg-red-100 text-red-800' },
}

function StockBadge({ status }: { status: string }) {
  const { label, cls } = STOCK_LABELS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}>
      {label}
    </span>
  )
}

// ─── Available quantity display ───────────────────────────────────────────────

function AvailCell({ qty, reserved, available }: { qty: number; reserved: number; available: number }) {
  if (qty === 0) return <span className="text-gray-300 text-sm">—</span>
  if (available <= 0) return <span className="font-semibold text-red-600 text-sm">0</span>
  if (available <= 3) return <span className="font-semibold text-yellow-600 text-sm">{available}</span>
  return <span className="font-semibold text-green-700 text-sm">{available}</span>
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard not available
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

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  products: PriceListProduct[]
}

export function PriceListClient({ products }: Props) {
  const [search, setSearch]           = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Derive unique categories from all products
  const allCategories = useMemo<PriceListCategory[]>(() => {
    const seen = new Map<string, PriceListCategory>()
    for (const p of products) {
      for (const cat of p.categories) {
        if (!seen.has(cat.id)) seen.set(cat.id, cat)
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name_uk.localeCompare(b.name_uk))
  }, [products])

  // Expand each product into one row per color variant
  const rows = useMemo<PriceListRow[]>(() => {
    const result: PriceListRow[] = []
    for (const p of products) {
      const imgUrl = getPrimaryImage(p.media)
      const base = {
        productId:      p.id,
        code:           p.code,
        name_uk:        p.name_uk,
        name_ru:        p.name_ru,
        stock_status:   p.stock_status,
        material_uk:    p.material_uk,
        primaryImageUrl: imgUrl,
        categories:     p.categories,
      }

      if (p.colors_json.length > 0) {
        for (const c of p.colors_json) {
          const qty      = c.quantity ?? 0
          const reserved = c.reserved_quantity ?? 0
          result.push({
            ...base,
            color:             c.color,
            price_retail:      c.price_retail,
            price_drop:        c.price_drop,
            quantity:          qty,
            reserved_quantity: reserved,
            available:         Math.max(0, qty - reserved),
          })
        }
      } else {
        // Fallback: no color variants — single row using product-level prices
        result.push({
          ...base,
          color:             '—',
          price_retail:      p.price_retail,
          price_drop:        p.price_drop,
          quantity:          0,
          reserved_quantity: 0,
          available:         0,
        })
      }
    }
    return result
  }, [products])

  // Apply filters (search now includes color name)
  const filtered = useMemo<PriceListRow[]>(() => {
    let result = rows

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(r =>
        r.code.toLowerCase().includes(q) ||
        r.name_uk.toLowerCase().includes(q) ||
        (r.name_ru?.toLowerCase().includes(q) ?? false) ||
        r.color.toLowerCase().includes(q)
      )
    }

    if (stockFilter !== 'all') {
      result = result.filter(r => r.stock_status === stockFilter)
    }

    if (categoryFilter !== 'all') {
      result = result.filter(r => r.categories.some(c => c.id === categoryFilter))
    }

    return result
  }, [rows, search, stockFilter, categoryFilter])

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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Пошук за кодом, назвою або кольором..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>

        {allCategories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-white">
              <SelectValue placeholder="Категорія" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі категорії</SelectItem>
              {allCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name_uk}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

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
        {filtered.length === rows.length
          ? `${rows.length} позицій`
          : `${filtered.length} з ${rows.length} позицій`}
      </p>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-lg border">
          Позицій не знайдено
        </div>
      )}

      {/* ── Desktop table ────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="hidden md:block overflow-hidden rounded-lg bg-white shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-3 w-12"></th>
                  <th className="px-3 py-3">Код</th>
                  <th className="px-3 py-3">Назва</th>
                  <th className="px-3 py-3">Колір</th>
                  <th className="px-3 py-3 text-right">Роздріб</th>
                  <th className="px-3 py-3 text-right">Дроп</th>
                  <th className="px-3 py-3 text-right">К-сть</th>
                  <th className="px-3 py-3 text-right">Резерв</th>
                  <th className="px-3 py-3 text-right">Доступно</th>
                  <th className="px-3 py-3">Статус</th>
                  <th className="px-3 py-3">Категорія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((row, idx) => {
                  // Visual separator between different products
                  const isGroupStart = idx === 0 || filtered[idx - 1].productId !== row.productId
                  return (
                    <tr
                      key={`${row.productId}-${row.color}-${idx}`}
                      className={`hover:bg-gray-50 transition-colors ${isGroupStart && idx > 0 ? 'border-t-2 border-gray-200' : ''}`}
                    >
                      {/* Thumbnail */}
                      <td className="px-3 py-2">
                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {row.primaryImageUrl ? (
                            <Image
                              src={row.primaryImageUrl}
                              alt={row.name_uk}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full text-[9px] font-bold text-gray-400">
                              {row.code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-3 py-2">
                        <div className="flex items-center">
                          <span className="font-mono font-semibold text-gray-900 whitespace-nowrap">{row.code}</span>
                          <CopyButton text={row.code} />
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-3 py-2 max-w-[180px]">
                        <p className="font-medium text-gray-900 leading-snug truncate">{row.name_uk}</p>
                        {row.material_uk && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug truncate">{row.material_uk}</p>
                        )}
                      </td>

                      {/* Color */}
                      <td className="px-3 py-2">
                        <span className="text-gray-800 whitespace-nowrap">{row.color}</span>
                      </td>

                      {/* Retail */}
                      <td className="px-3 py-2 text-right whitespace-nowrap text-gray-600">
                        {formatPrice(row.price_retail)}
                      </td>

                      {/* Drop */}
                      <td className="px-3 py-2 text-right whitespace-nowrap font-bold text-gray-900">
                        {formatPrice(row.price_drop)}
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-2 text-right">
                        <span className="text-gray-700 text-sm">
                          {row.quantity > 0 ? row.quantity : <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Reserved */}
                      <td className="px-3 py-2 text-right">
                        <span className="text-gray-700 text-sm">
                          {row.reserved_quantity > 0 ? row.reserved_quantity : <span className="text-gray-300">—</span>}
                        </span>
                      </td>

                      {/* Available */}
                      <td className="px-3 py-2 text-right">
                        <AvailCell qty={row.quantity} reserved={row.reserved_quantity} available={row.available} />
                      </td>

                      {/* Stock status */}
                      <td className="px-3 py-2">
                        <StockBadge status={row.stock_status} />
                      </td>

                      {/* Categories */}
                      <td className="px-3 py-2">
                        {row.categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {row.categories.map(cat => (
                              <span
                                key={cat.id}
                                className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600 whitespace-nowrap"
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
        <div className="md:hidden space-y-2.5">
          {filtered.map((row, idx) => {
            const isGroupStart = idx === 0 || filtered[idx - 1].productId !== row.productId
            return (
              <div
                key={`${row.productId}-${row.color}-${idx}`}
                className={`bg-white rounded-lg border shadow-sm p-3 ${isGroupStart && idx > 0 ? 'mt-4' : ''}`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    {row.primaryImageUrl ? (
                      <Image
                        src={row.primaryImageUrl}
                        alt={row.name_uk}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xs font-bold text-gray-400">
                        {row.code}
                      </span>
                    )}
                  </div>

                  {/* Header info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-mono font-bold text-gray-900 text-sm">{row.code}</span>
                      <CopyButton text={row.code} />
                      <span className="ml-auto">
                        <StockBadge status={row.stock_status} />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-snug truncate">{row.name_uk}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium">{row.color}</span>
                      {row.material_uk && (
                        <span className="text-gray-400"> · {row.material_uk}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Prices + qty grid */}
                <div className="mt-2.5 grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 block">Роздріб</span>
                    <span className="font-medium text-gray-700">{formatPrice(row.price_retail)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Дроп</span>
                    <span className="font-bold text-gray-900">{formatPrice(row.price_drop)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Доступно</span>
                    <AvailCell qty={row.quantity} reserved={row.reserved_quantity} available={row.available} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">К-сть</span>
                    <span className="text-gray-700">
                      {row.quantity > 0 ? row.quantity : <span className="text-gray-300">—</span>}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Резерв</span>
                    <span className="text-gray-700">
                      {row.reserved_quantity > 0 ? row.reserved_quantity : <span className="text-gray-300">—</span>}
                    </span>
                  </div>
                </div>

                {/* Categories */}
                {row.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.categories.map(cat => (
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
