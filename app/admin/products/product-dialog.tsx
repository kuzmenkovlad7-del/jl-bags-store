'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { Product, StockStatus } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'

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
  })

  useEffect(() => {
    if (product) {
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
      })
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
      })
    }
  }, [product])

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
      }

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(data)
          .eq('id', product.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert(data)
        if (error) throw error
      }

      toast({ title: product ? 'Product updated' : 'Product created' })
      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
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
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code</Label>
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
              <Label htmlFor="slug">Slug</Label>
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
              <Label htmlFor="name_uk">Name (UK)</Label>
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
              <Label htmlFor="name_ru">Name (RU)</Label>
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
              <Label htmlFor="description_uk">Description (UK)</Label>
              <Textarea
                id="description_uk"
                value={formData.description_uk}
                onChange={(e) =>
                  setFormData({ ...formData, description_uk: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="description_ru">Description (RU)</Label>
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
              <Label htmlFor="material_uk">Material (UK)</Label>
              <Input
                id="material_uk"
                value={formData.material_uk}
                onChange={(e) =>
                  setFormData({ ...formData, material_uk: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="material_ru">Material (RU)</Label>
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
            <Label htmlFor="size_text">Size</Label>
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
              <Label htmlFor="price_retail">Retail Price</Label>
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
              <Label htmlFor="price_drop">Drop Price</Label>
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
              <Label htmlFor="stock_status">Stock Status</Label>
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
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="preorder">Preorder</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="colors_json">Colors JSON</Label>
            <Textarea
              id="colors_json"
              value={formData.colors_json}
              onChange={(e) =>
                setFormData({ ...formData, colors_json: e.target.value })
              }
              placeholder='[{"color":"чорний","price_drop":640,"price_retail":740}]'
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
