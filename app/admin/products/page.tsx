'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Copy, Eye, EyeOff, Pencil, Plus, Search, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { formatPrice } from '@/lib/utils'
import { ProductDialog } from './product-dialog'

type FilterKey = 'all' | 'in_stock' | 'out_of_stock' | 'active' | 'inactive' | 'with_photos' | 'without_photos' | 'missing_desc' | 'missing_retail'
type SortKey   = 'code_asc' | 'code_desc' | 'updated_desc' | 'sort_order'

interface Stats { total: number; active: number; inStock: number; outOfStock: number }

const PAGE_SIZE = 50

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',            label: 'Усі' },
  { key: 'in_stock',       label: 'В наличии' },
  { key: 'out_of_stock',   label: 'Нет в наличии' },
  { key: 'with_photos',    label: 'З фото' },
  { key: 'without_photos', label: 'Без фото' },
  { key: 'missing_desc',   label: 'Без опису' },
  { key: 'missing_retail', label: 'Без роздр. ціни' },
]

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'code_asc',    label: 'Код А→Я' },
  { key: 'code_desc',   label: 'Код Я→А' },
  { key: 'updated_desc', label: 'Нещодавно змінені' },
  { key: 'sort_order',   label: 'За sort_order' },
]

export default function AdminProductsPage() {
  const { toast } = useToast()
  const [products, setProducts]         = useState<Product[]>([])
  const [total, setTotal]               = useState(0)
  const [stats, setStats]               = useState<Stats | null>(null)
  const [loading, setLoading]           = useState(true)
  const [dialogOpen, setDialogOpen]     = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch]             = useState('')
  const [filter, setFilter]             = useState<FilterKey>('all')
  const [sort, setSort]                 = useState<SortKey>('code_asc')
  const [page, setPage]                 = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadProducts = useCallback(async (opts: {
    search: string; filter: FilterKey; sort: SortKey; page: number
  }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search:   opts.search,
        filter:   opts.filter,
        sort:     opts.sort,
        page:     String(opts.page),
        pageSize: String(PAGE_SIZE),
      })
      const res  = await fetch(`/api/admin/products?${params}`)
      const json = await res.json()
      if (json.error) {
        toast({ title: 'Помилка', description: json.error, variant: 'destructive' })
      } else {
        setProducts(json.products ?? [])
        setTotal(json.total ?? 0)
        if (json.stats) setStats(json.stats)
      }
    } catch (e: any) {
      toast({ title: 'Помилка', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const delay = search ? 400 : 0
    debounceRef.current = setTimeout(() => loadProducts({ search, filter, sort, page }), delay)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, filter, sort, page, loadProducts])

  function changeFilter(f: FilterKey) { setFilter(f); setPage(1) }
  function changeSort(s: SortKey)     { setSort(s);   setPage(1) }
  function changeSearch(v: string)    { setSearch(v); setPage(1) }

  async function toggleActive(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    if (error) {
      toast({ title: 'Помилка', description: error.message, variant: 'destructive' })
      return
    }
    loadProducts({ search, filter, sort, page })
  }

  async function duplicateProduct(product: Product) {
    const { error } = await supabase.from('products').insert({
      code:           `${product.code}-copy`,
      slug:           `${product.slug}-copy`,
      name_uk:        `${product.name_uk} (копія)`,
      name_ru:        product.name_ru ? `${product.name_ru} (копия)` : null,
      description_uk: product.description_uk,
      description_ru: product.description_ru,
      material_uk:    product.material_uk,
      material_ru:    product.material_ru,
      size_text:      product.size_text,
      colors_json:    product.colors_json,
      price_retail:   product.price_retail,
      price_drop:     product.price_drop,
      stock_status:   product.stock_status,
      is_active:      false,
    })
    if (error) {
      toast({ title: 'Помилка', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Товар скопійовано' })
    loadProducts({ search, filter, sort, page })
  }

  async function deleteProduct(id: string) {
    if (!confirm('Видалити товар? Цю дію не можна скасувати.')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      toast({ title: 'Помилка', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Товар видалено' })
    loadProducts({ search, filter, sort, page })
  }

  const totalPages   = Math.ceil(total / PAGE_SIZE)
  const variantCount = products.reduce((s, p) => s + (p.colors_json?.length ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Товари</h1>
        <Button onClick={() => { setEditingProduct(null); setDialogOpen(true) }} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Додати товар
        </Button>
      </div>

      {/* Compact stats bar */}
      {stats && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <span><span className="font-semibold text-gray-900">{stats.total}</span> всего товаров</span>
          <span className="text-gray-300">·</span>
          <span><span className="font-semibold text-gray-900">{stats.active}</span> активных</span>
          <span className="text-gray-300">·</span>
          <span><span className="font-semibold text-green-700">{stats.inStock}</span> в наличии</span>
          <span className="text-gray-300">·</span>
          <span><span className="font-semibold text-gray-500">{stats.outOfStock}</span> нет в наличии</span>
          {variantCount > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span><span className="font-semibold text-gray-900">{variantCount}</span> вариантов на странице</span>
            </>
          )}
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Пошук за кодом, назвою, матеріалом..."
            value={search}
            onChange={e => changeSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sort} onValueChange={v => changeSort(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => changeFilter(f.key)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filter === f.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {loading ? 'Загрузка…' : `Показано ${products.length} из ${total} товаров`}
      </p>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {products.map(product => (
          <div key={product.id} className="rounded-lg border bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Код</div>
                <div className="font-semibold">{product.code}</div>
              </div>
              <span className={[
                'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                product.stock_status === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600',
              ].join(' ')}>
                {product.stock_status === 'in_stock' ? 'В наличии' : 'Нет в наличии'}
              </span>
            </div>
            <div className="mb-1 text-sm font-medium">{product.name_uk}</div>
            <div className="mb-1 text-xs text-muted-foreground">
              {product.colors_json?.length ?? 0} вар. ·{' '}
              Розница: {formatPrice(product.price_retail)} ·{' '}
              Дроп: {formatPrice(product.price_drop)}
            </div>
            {!product.is_active && (
              <div className="mb-2 text-xs text-amber-600 font-medium">Неактивний</div>
            )}
            <div className="grid grid-cols-4 gap-1">
              <Button variant="ghost" size="sm" onClick={() => toggleActive(product)} className="h-9 px-2" title={product.is_active ? 'Деактивувати' : 'Активувати'}>
                {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setDialogOpen(true) }} className="h-9 px-2">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => duplicateProduct(product)} className="h-9 px-2">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)} className="h-9 px-2 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Код</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Назва</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Варіанти</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ціни</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Фото</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(product => {
                const mediaArr = product.media as any[]
                const hasPhoto = Array.isArray(mediaArr) && mediaArr.length > 0
                return (
                  <tr key={product.id} className={product.is_active ? '' : 'opacity-50'}>
                    <td className="px-4 py-3 text-sm font-mono font-medium">{product.code}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">{product.name_uk}</div>
                      {product.name_ru && (
                        <div className="text-xs text-muted-foreground">{product.name_ru}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {product.colors_json?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <div>Розница: {formatPrice(product.price_retail)}</div>
                      <div>Дроп: {formatPrice(product.price_drop)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={[
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        product.stock_status === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600',
                      ].join(' ')}>
                        {product.stock_status === 'in_stock' ? 'В наличии' : 'Нет в наличии'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {hasPhoto
                        ? <span className="text-green-600">{mediaArr.length} фото</span>
                        : <span className="text-amber-500">Нет фото</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(product)} title={product.is_active ? 'Деактивувати' : 'Активувати'}>
                          {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingProduct(product); setDialogOpen(true) }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => duplicateProduct(product)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Попередня
          </Button>
          <span className="text-sm text-muted-foreground">
            Сторінка {page} з {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Наступна
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          Товарів не знайдено
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditingProduct(null) }}
        product={editingProduct}
        onSuccess={() => {
          setDialogOpen(false)
          setEditingProduct(null)
          loadProducts({ search, filter, sort, page })
        }}
      />
    </div>
  )
}
