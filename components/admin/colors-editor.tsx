'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X } from 'lucide-react'

export interface ColorPrice {
  color: string
  price_retail: number
  price_drop: number
  quantity: number
  reserved_quantity: number
}

interface ColorsEditorProps {
  colors: ColorPrice[]
  onChange: (colors: ColorPrice[]) => void
}

export function ColorsEditor({ colors, onChange }: ColorsEditorProps) {
  function addColor() {
    onChange([...colors, { color: '', price_retail: 0, price_drop: 0, quantity: 0, reserved_quantity: 0 }])
  }

  function removeColor(index: number) {
    onChange(colors.filter((_, i) => i !== index))
  }

  function updateColor(index: number, field: keyof ColorPrice, value: string | number) {
    const updated = [...colors]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Цвета, цены и наличие</Label>
        <Button type="button" size="sm" variant="outline" onClick={addColor}>
          <Plus className="h-3 w-3 mr-1" />
          Добавить цвет
        </Button>
      </div>

      {colors.length === 0 && (
        <p className="text-sm text-muted-foreground">Нет цветов. Нажмите &ldquo;Добавить цвет&rdquo;</p>
      )}

      {colors.map((color, index) => (
        <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* Color name */}
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor={`color-${index}`} className="text-xs">Цвет</Label>
              <Input
                id={`color-${index}`}
                value={color.color}
                onChange={e => updateColor(index, 'color', e.target.value)}
                placeholder="черный"
              />
            </div>

            {/* Retail price */}
            <div>
              <Label htmlFor={`retail-${index}`} className="text-xs">Розница</Label>
              <Input
                id={`retail-${index}`}
                type="number"
                step="0.01"
                value={color.price_retail}
                onChange={e => updateColor(index, 'price_retail', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Drop price */}
            <div>
              <Label htmlFor={`drop-${index}`} className="text-xs">Дроп</Label>
              <Input
                id={`drop-${index}`}
                type="number"
                step="0.01"
                value={color.price_drop}
                onChange={e => updateColor(index, 'price_drop', parseFloat(e.target.value) || 0)}
              />
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor={`qty-${index}`} className="text-xs">К-сть</Label>
              <Input
                id={`qty-${index}`}
                type="number"
                min="0"
                step="1"
                value={color.quantity}
                onChange={e => updateColor(index, 'quantity', parseInt(e.target.value, 10) || 0)}
              />
            </div>

            {/* Reserved quantity */}
            <div>
              <Label htmlFor={`res-${index}`} className="text-xs">Резерв</Label>
              <Input
                id={`res-${index}`}
                type="number"
                min="0"
                step="1"
                value={color.reserved_quantity}
                onChange={e => updateColor(index, 'reserved_quantity', parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => removeColor(index)}
            className="mt-6 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
