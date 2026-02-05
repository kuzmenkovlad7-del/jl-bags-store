'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase/client'
import { Product, StockStatus, Category } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { ta } from '@/lib/admin-i18n'
import { MediaUpload } from '@/components/admin/media-upload'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [productMedia, setProductMedia] = useState(product?.media || [])
  const [formData, setFormData] = useState({
    code: '',
    name_uk: '',
    name_ru: '',
    slug: '',
    description_uk: '',
    description_ru: '',
    material_uk: '',
    material_ru: '',
    size_text: '',
    price_retail: '0',
    price_drop: '0',
    stock_status: 'in_stock' as StockStatus,
    colors_json: '[]',
    categories: [] as string[],
    is_new: false,
    is_hit: false,
    is_sale: false,
  })

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (data) setCategories(data)
    }

    async function loadProductCategories() {
      if (!product?.id) return []

      const { data } = await supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', product.id)

      return data?.map(pc => pc.category_id) || []
    }

    async function loadProductMedia() {
      if (!product?.id) return

      const { data } = await supabase
        .from('product_media')
        .select('*')
        .eq('product_id', product.id)
        .order('position')

      if (data) setProductMedia(data)
    }

    loadCategories()

    if (product) {
      loadProductCategories().then(categoryIds => {
        setFormData({
          code: product.code,
          name_uk: product.name_uk,
          name_ru: product.name_ru || '',
          slug: product.slug,
          description_uk: product.description_uk,
          description_ru: product.description_ru || '',
          material_uk: product.material_uk,
          material_ru: product.material_ru || '',
          size_text: product.size_text,
          price_retail: product.price_retail.toString(),
          price_drop: product.price_drop.toString(),
          stock_status: product.stock_status,
          colors_json: JSON.stringify(product.colors_json || []),
          categories: categoryIds,
          is_new: product.is_new || false,
          is_hit: product.is_hit || false,
          is_sale: product.is_sale || false,
        })
      })
      loadProductMedia()
    } else {
      setFormData({
        code: '',
        name_uk: '',
        name_ru: '',
        slug: '',
        description_uk: '',
        description_ru: '',
        material_uk: '',
        material_ru: '',
        size_text: '',
        price_retail: '0',
        price_drop: '0',
        stock_status: 'in_stock',
        colors_json: '[]',
        categories: [],
        is_new: false,
        is_hit: false,
        is_sale: false,
      })
      setProductMedia([])
    }
  }, [product])

  async function handleMediaUpdate() {
    if (!product?.id) return

    const { data } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', product.id)
      .order('position')

    if (data) setProductMedia(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let colorsJson
      try {
        colorsJson = JSON.parse(formData.colors_json)
      } catch {
        colorsJson = []
      }

      const data = {
        code: formData.code,
        name_uk: formData.name_uk,
        name_ru: formData.name_ru || null,
        slug: formData.slug,
        description_uk: formData.description_uk,
        description_ru: formData.description_ru || null,
        material_uk: formData.material_uk,
        material_ru: formData.material_ru || null,
        size_text: formData.size_text,
        price_retail: parseFloat(formData.price_retail),
        price_drop: parseFloat(formData.price_drop),
        stock_status: formData.stock_status,
        colors_json: colorsJson,
        is_new: formData.is_new,
        is_hit: formData.is_hit,
        is_sale: formData.is_sale,
      }

      let productId: string

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', product.id)

        if (error) throw error
        productId = product.id
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(data)
          .select()
          .single()

        if (error) throw error
        productId = newProduct.id
      }

      // Update product categories
      // First delete existing categories
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId)

      // Then insert new categories
      if (formData.categories.length > 0) {
        const categoryInserts = formData.categories.map(categoryId => ({
          product_id: productId,
          category_id: categoryId,
        }))

        const { error: categoryError } = await supabase
          .from('product_categories')
          .insert(categoryInserts)

        if (categoryError) throw categoryError
      }

      toast({ title: product ? ta('products.productUpdated') : ta('products.productCreated') })
      onSuccess()
    } catch (error: any) {
      toast({
        title: ta('common.error'),
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? ta('products.editProduct') : ta('products.addProduct')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">{ta('productForm.code')}</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="slug">{ta('productForm.slug')}</Label>
              <Input
                id="slug"
                required
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name_uk">{ta('productForm.nameUk')}</Label>
              <Input
                id="name_uk"
                required
                value={formData.name_uk}
                onChange={(e) =>
                  setFormData({ ...formData, name_uk: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="name_ru">{ta('productForm.nameRu')}</Label>
              <Input
                id="name_ru"
                value={formData.name_ru}
                onChange={(e) =>
                  setFormData({ ...formData, name_ru: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description_uk">{ta('productForm.descriptionUk')}</Label>
              <Textarea
                id="description_uk"
                value={formData.description_uk}
                onChange={(e) =>
                  setFormData({ ...formData, description_uk: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description_ru">{ta('productForm.descriptionRu')}</Label>
              <Textarea
                id="description_ru"
                value={formData.description_ru}
                onChange={(e) =>
                  setFormData({ ...formData, description_ru: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material_uk">{ta('productForm.materialUk')}</Label>
              <Input
                id="material_uk"
                value={formData.material_uk}
                onChange={(e) =>
                  setFormData({ ...formData, material_uk: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="material_ru">{ta('productForm.materialRu')}</Label>
              <Input
                id="material_ru"
                value={formData.material_ru}
                onChange={(e) =>
                  setFormData({ ...formData, material_ru: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="size_text">{ta('productForm.size')}</Label>
            <Input
              id="size_text"
              value={formData.size_text}
              onChange={(e) =>
                setFormData({ ...formData, size_text: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price_retail">{ta('productForm.priceRetail')}</Label>
              <Input
                id="price_retail"
                type="number"
                step="0.01"
                value={formData.price_retail}
                onChange={(e) =>
                  setFormData({ ...formData, price_retail: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="price_drop">{ta('productForm.priceDrop')}</Label>
              <Input
                id="price_drop"
                type="number"
                step="0.01"
                value={formData.price_drop}
                onChange={(e) =>
                  setFormData({ ...formData, price_drop: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="stock_status">{ta('productForm.stockStatus')}</Label>
              <Select
                value={formData.stock_status}
                onValueChange={(value: StockStatus) =>
                  setFormData({ ...formData, stock_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">{ta('productForm.stockInStock')}</SelectItem>
                  <SelectItem value="low_stock">{ta('productForm.stockLowStock')}</SelectItem>
                  <SelectItem value="preorder">{ta('productForm.stockPreorder')}</SelectItem>
                  <SelectItem value="out_of_stock">{ta('productForm.stockOutOfStock')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="colors_json">{ta('productForm.colorsJson')}</Label>
            <Textarea
              id="colors_json"
              value={formData.colors_json}
              onChange={(e) =>
                setFormData({ ...formData, colors_json: e.target.value })
              }
              placeholder={ta('productForm.colorsPlaceholder')}
            />
          </div>

          {product?.id && (
            <div className="border-t pt-4">
              <Label className="mb-2 block">Media</Label>
              <MediaUpload
                productId={product.id}
                productCode={product.code}
                media={productMedia}
                onMediaUpdate={handleMediaUpdate}
              />
            </div>
          )}

          <div className="border-t pt-4">
            <Label className="mb-3 block">Categories</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={formData.categories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          categories: [...formData.categories, category.id],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          categories: formData.categories.filter(
                            (id) => id !== category.id
                          ),
                        })
                      }
                    }}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.name_uk}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="mb-3 block">Product Flags</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_new"
                  checked={formData.is_new}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_new: checked as boolean })
                  }
                />
                <label
                  htmlFor="is_new"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  New
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_hit"
                  checked={formData.is_hit}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_hit: checked as boolean })
                  }
                />
                <label
                  htmlFor="is_hit"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Hit
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_sale"
                  checked={formData.is_sale}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_sale: checked as boolean })
                  }
                />
                <label
                  htmlFor="is_sale"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Sale
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {ta('productForm.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? ta('productForm.saving') : ta('productForm.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
