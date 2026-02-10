'use client'

import { useEffect, useState } from 'react'
import { Plus, Eye, EyeOff, Copy, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { formatPrice } from '@/lib/utils'
import { ProductDialog } from './product-dialog'
import { ta } from '@/lib/admin-i18n'

export default function AdminProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, media:product_media(*)')
      .order('sort_order', { ascending: true })

    if (data) setProducts(data)
    setLoading(false)
  }

  async function toggleActive(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (error) {
      toast({
        title: ta('common.error'),
        description: ta('products.errorUpdate'),
        variant: 'destructive',
      })
      return
    }

    toast({ title: ta('products.productUpdated') })
    loadProducts()
  }

  async function duplicateProduct(product: Product) {
    const newCode = `${product.code}-copy`
    const newSlug = `${product.slug}-copy`

    const { error } = await supabase
      .from('products')
      .insert({
        code: newCode,
        name_uk: `${product.name_uk} (копія)`,
        name_ru: product.name_ru ? `${product.name_ru} (копия)` : null,
        slug: newSlug,
        description_uk: product.description_uk,
        description_ru: product.description_ru,
        material_uk: product.material_uk,
        material_ru: product.material_ru,
        size_text: product.size_text,
        colors_json: product.colors_json,
        price_retail: product.price_retail,
        price_drop: product.price_drop,
        stock_status: product.stock_status,
        is_active: false,
      })

    if (error) {
      toast({
        title: ta('common.error'),
        description: ta('products.errorUpdate'),
        variant: 'destructive',
      })
      return
    }

    toast({ title: ta('products.productDuplicated') })
    loadProducts()
  }

  async function deleteProduct(id: string) {
    if (!confirm(ta('products.confirmDelete'))) return

    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      toast({
        title: ta('common.error'),
        description: ta('products.errorDelete'),
        variant: 'destructive',
      })
      return
    }

    toast({ title: ta('products.productDeleted') })
    loadProducts()
  }

  function openCreateDialog() {
    setEditingProduct(null)
    setDialogOpen(true)
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  function stockLabel(status: string): string {
    switch (status) {
      case 'in_stock': return 'В наличии'
      case 'low_stock': return 'Заканчивается'
      case 'preorder': return 'Под заказ'
      case 'out_of_stock': return 'Нет в наличии'
      default: return status
    }
  }

  function handleDialogClose() {
    setDialogOpen(false)
    setEditingProduct(null)
    loadProducts()
  }

  if (loading) {
    return <div>{ta('products.loading')}</div>
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">{ta('products.title')}</h1>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {ta('products.addProduct')}
        </Button>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {products.map((product) => (
          <div key={product.id} className="rounded-lg border bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">{ta('products.code')}</div>
                <div className="text-base font-semibold">{product.code}</div>
              </div>
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs">
                {stockLabel(product.stock_status)}
              </span>
            </div>

            <div className="mb-1 text-sm font-medium">{product.name_ru || product.name_uk}</div>

            <div className="mb-3 text-xs text-muted-foreground">
              <div>{ta('products.retail')}: {formatPrice(product.price_retail)}</div>
              <div>{ta('products.drop')}: {formatPrice(product.price_drop)}</div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button variant="ghost" size="sm" onClick={() => toggleActive(product)} className="h-9 px-2">
                {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)} className="h-9 px-2">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => duplicateProduct(product)} className="h-9 px-2">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)} className="h-9 px-2">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">{ta('products.code')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{ta('products.name')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{ta('products.prices')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{ta('products.stock')}</th>
                <th className="px-4 py-3 text-left text-sm font-medium">{ta('products.status')}</th>
                <th className="px-4 py-3 text-right text-sm font-medium">{ta('products.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3 text-sm font-medium">{product.code}</td>
                  <td className="px-4 py-3 text-sm">{product.name_ru || product.name_uk}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="text-xs text-muted-foreground">
                      {ta('products.retail')}: {formatPrice(product.price_retail)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ta('products.drop')}: {formatPrice(product.price_drop)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {stockLabel(product.stock_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(product)}>
                      {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => duplicateProduct(product)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSuccess={handleDialogClose}
      />
    </div>
  )
}
