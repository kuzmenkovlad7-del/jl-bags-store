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
import MediaUpload from '@/components/admin/media-upload'
import { ColorsEditor, ColorPrice } from '@/components/admin/colors-editor'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export function ProductDialog({ open, onOpenChange, product, onSuccess }: ProductDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [productMedia, setProductMedia] = useState(product?.media || [])
  const [formData, setFormData] = useState({
    code:            '',
    name_uk:         '',
    name_ru:         '',
    slug:            '',
    description_uk:  '',
    description_ru:  '',
    material_uk:     '',
    material_ru:     '',
    size_text:       '',
    price_retail:    '0',
    price_drop:      '0',
    stock_status:    'in_stock' as StockStatus,
    colors:          [] as ColorPrice[],
    categories:      [] as string[],
    is_new:          false,
    is_hit:          false,
    is_sale:         false,
    seo_title:       '',
    seo_description: '',
    seo_h1:          '',
    og_title:        '',
    og_description:  '',
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

    async function loadProductCategories(): Promise<string[]> {
      if (!product?.id) return []
      const { data } = await supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', product.id)
      return data?.map((pc: { category_id: string }) => pc.category_id) || []
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
          code:            product.code,
          name_uk:         product.name_uk,
          name_ru:         product.name_ru || '',
          slug:            product.slug,
          description_uk:  product.description_uk,
          description_ru:  product.description_ru || '',
          material_uk:     product.material_uk,
          material_ru:     product.material_ru || '',
          size_text:       product.size_text,
          price_retail:    product.price_retail.toString(),
          price_drop:      product.price_drop.toString(),
          stock_status:    product.stock_status,
          colors:          (product.colors_json || []).map(c => ({
            color:             c.color,
            price_retail:      c.price_retail,
            price_drop:        c.price_drop,
            quantity:          c.quantity ?? 0,
            reserved_quantity: c.reserved_quantity ?? 0,
          })),
          categories:      categoryIds,
          is_new:          product.is_new  || false,
          is_hit:          product.is_hit  || false,
          is_sale:         product.is_sale || false,
          seo_title:       product.seo_title       || '',
          seo_description: product.seo_description || '',
          seo_h1:          product.seo_h1          || '',
          og_title:        product.og_title        || '',
          og_description:  product.og_description  || '',
        })
      })
      loadProductMedia()
    } else {
      setFormData({
        code: '', name_uk: '', name_ru: '', slug: '',
        description_uk: '', description_ru: '',
        material_uk: '', material_ru: '',
        size_text: '', price_retail: '0', price_drop: '0',
        stock_status: 'in_stock',
        colors: [], categories: [],
        is_new: false, is_hit: false, is_sale: false,
        seo_title: '', seo_description: '', seo_h1: '',
        og_title: '', og_description: '',
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
      const data = {
        code:            formData.code,
        name_uk:         formData.name_uk,
        name_ru:         formData.name_ru || null,
        slug:            formData.slug,
        description_uk:  formData.description_uk,
        description_ru:  formData.description_ru || null,
        material_uk:     formData.material_uk,
        material_ru:     formData.material_ru || null,
        size_text:       formData.size_text,
        price_retail:    parseFloat(formData.price_retail),
        price_drop:      parseFloat(formData.price_drop),
        stock_status:    formData.stock_status,
        colors_json:     formData.colors,
        is_new:          formData.is_new,
        is_hit:          formData.is_hit,
        is_sale:         formData.is_sale,
        seo_title:       formData.seo_title       || null,
        seo_description: formData.seo_description || null,
        seo_h1:          formData.seo_h1          || null,
        og_title:        formData.og_title        || null,
        og_description:  formData.og_description  || null,
      }

      let productId: string

      if (product) {
        const { error } = await supabase.from('products').update(data).eq('id', product.id)
        if (error) throw error
        productId = product.id
      } else {
        const { data: newProduct, error } = await supabase.from('products').insert(data).select().single()
        if (error) throw error
        productId = newProduct.id
      }

      await supabase.from('product_categories').delete().eq('product_id', productId)
      if (formData.categories.length > 0) {
        const { error: catError } = await supabase.from('product_categories').insert(
          formData.categories.map(catId => ({ product_id: productId, category_id: catId }))
        )
        if (catError) throw catError
      }

      toast({ title: product ? ta('products.productUpdated') : ta('products.productCreated') })
      onSuccess()
    } catch (error: any) {
      toast({ title: ta('common.error'), description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function set<K extends keyof typeof formData>(key: K, value: typeof formData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-12px)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle>{product ? ta('products.editProduct') : ta('products.addProduct')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Synced-fields notice */}
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <strong>Синхронізується з Google Таблиці:</strong> залишки та дроп-ціни варіантів оновлюються автоматично.{' '}
            Фото, опис, роздрібна ціна, категорії та SEO — заповнюються вручну.
          </div>

          {/* Code + Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">{ta('productForm.code')}</Label>
              <Input id="code" required value={formData.code} onChange={e => set('code', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="slug">{ta('productForm.slug')}</Label>
              <Input id="slug" required value={formData.slug} onChange={e => set('slug', e.target.value)} />
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name_uk">{ta('productForm.nameUk')}</Label>
              <Input id="name_uk" required value={formData.name_uk} onChange={e => set('name_uk', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="name_ru">{ta('productForm.nameRu')}</Label>
              <Input id="name_ru" value={formData.name_ru} onChange={e => set('name_ru', e.target.value)} />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description_uk">{ta('productForm.descriptionUk')}</Label>
              <Textarea id="description_uk" value={formData.description_uk} onChange={e => set('description_uk', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description_ru">{ta('productForm.descriptionRu')}</Label>
              <Textarea id="description_ru" value={formData.description_ru} onChange={e => set('description_ru', e.target.value)} />
            </div>
          </div>

          {/* Materials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material_uk">{ta('productForm.materialUk')}</Label>
              <Input id="material_uk" value={formData.material_uk} onChange={e => set('material_uk', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="material_ru">{ta('productForm.materialRu')}</Label>
              <Input id="material_ru" value={formData.material_ru} onChange={e => set('material_ru', e.target.value)} />
            </div>
          </div>

          {/* Size */}
          <div>
            <Label htmlFor="size_text">{ta('productForm.size')}</Label>
            <Input id="size_text" value={formData.size_text} onChange={e => set('size_text', e.target.value)} />
          </div>

          {/* Prices + Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price_retail">{ta('productForm.priceRetail')}</Label>
              <Input id="price_retail" type="number" step="0.01" value={formData.price_retail} onChange={e => set('price_retail', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="price_drop">
                {ta('productForm.priceDrop')}
                <span className="ml-1 text-xs font-normal text-amber-600">(синхр.)</span>
              </Label>
              <Input id="price_drop" type="number" step="0.01" value={formData.price_drop} onChange={e => set('price_drop', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="stock_status">{ta('productForm.stockStatus')}</Label>
              <Select value={formData.stock_status} onValueChange={(v: StockStatus) => set('stock_status', v)}>
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

          {/* Colors / variants */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Label>Варіанти (кольори)</Label>
              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700 border border-amber-200">
                кількість і дроп-ціна синхронізуються з Google Таблиці
              </span>
            </div>
            <ColorsEditor
              colors={formData.colors}
              onChange={colors => set('colors', colors)}
            />
          </div>

          {/* Media */}
          {product?.id && (
            <div className="border-t pt-4">
              <Label className="mb-2 block">{ta('productForm.media')}</Label>
              <MediaUpload
                productId={product.id}
                productCode={formData.code}
                media={productMedia as any}
                onMediaChange={items => setProductMedia(items as any)}
                onMediaUpdate={handleMediaUpdate}
              />
            </div>
          )}

          {/* Categories */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">{ta('productForm.categories')}</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${cat.id}`}
                    checked={formData.categories.includes(cat.id)}
                    onCheckedChange={checked => set(
                      'categories',
                      checked
                        ? [...formData.categories, cat.id]
                        : formData.categories.filter(id => id !== cat.id)
                    )}
                  />
                  <label htmlFor={`cat-${cat.id}`} className="cursor-pointer text-sm font-medium leading-none">
                    {cat.name_uk}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="border-t pt-4">
            <Label className="mb-3 block">Мітки товару</Label>
            <div className="grid grid-cols-3 gap-4">
              {([['is_new', ta('productForm.isNew')], ['is_hit', ta('productForm.isHit')], ['is_sale', ta('productForm.isSale')]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={formData[key]}
                    onCheckedChange={checked => set(key, checked as boolean)}
                  />
                  <label htmlFor={key} className="cursor-pointer text-sm font-medium leading-none">{label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* SEO */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label className="text-base font-semibold">SEO</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Якщо поля порожні — метадані генеруються автоматично з назви, коду та опису товару.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={e => set('seo_title', e.target.value)}
                  placeholder={`${formData.name_uk || 'Назва'} — купити | JL`}
                  maxLength={80}
                />
                <p className="mt-0.5 text-xs text-muted-foreground">{formData.seo_title.length}/80 символів</p>
              </div>
              <div>
                <Label htmlFor="seo_h1">H1 заголовок</Label>
                <Input
                  id="seo_h1"
                  value={formData.seo_h1}
                  onChange={e => set('seo_h1', e.target.value)}
                  placeholder={formData.name_uk || 'Заголовок сторінки'}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description}
                onChange={e => set('seo_description', e.target.value)}
                placeholder="Короткий опис для пошукових систем (до 160 символів)"
                rows={2}
                maxLength={200}
              />
              <p className="mt-0.5 text-xs text-muted-foreground">{formData.seo_description.length}/160 символів</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="og_title">OG Title</Label>
                <Input
                  id="og_title"
                  value={formData.og_title}
                  onChange={e => set('og_title', e.target.value)}
                  placeholder="Open Graph заголовок (для соцмереж)"
                />
              </div>
              <div>
                <Label htmlFor="og_description">OG Description</Label>
                <Input
                  id="og_description"
                  value={formData.og_description}
                  onChange={e => set('og_description', e.target.value)}
                  placeholder="Open Graph опис"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
