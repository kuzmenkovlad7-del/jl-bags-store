'use client'

import { useState, useEffect } from 'react'
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

    if (data) {
      setProducts(data)
    }
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

    const { data, error } = await supabase
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
      .select()
      .single()

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{ta('products.title')}</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {ta('products.addProduct')}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
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
                <td className="px-4 py-3 text-sm">{product.name_uk}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="text-xs text-muted-foreground">
                    {ta('products.retail')}: {formatPrice(product.price_retail)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ta('products.drop')}: {formatPrice(product.price_drop)}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100">
                    {product.stock_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(product)}
                  >
                    {product.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateProduct(product)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
