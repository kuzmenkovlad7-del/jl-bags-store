'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { OrderDialog } from '@/components/order-dialog'
import { OrderType } from '@/lib/types'
import { CheckCircle, RefreshCw, Truck } from 'lucide-react'

interface ProductClientProps {
  product: Product
  locale: Locale
}

export function ProductClient({ product, locale }: ProductClientProps) {
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderType, setOrderType] = useState<OrderType>('retail')
  const [selectedColor, setSelectedColor] = useState('')
  const [showReseller, setShowReseller] = useState(false)

  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  const description =
    locale === 'ru' && product.description_ru ? product.description_ru : product.description_uk
  const material =
    locale === 'ru' && product.material_ru ? product.material_ru : product.material_uk

  const colors = product.colors_json || []

  // Strip lines that embed price info (роздріб/дроп/опт + грн/₴) so retail
  // visitors don't see mixed pricing in the description body.
  function cleanDescription(text: string): string {
    return text
      .split('\n')
      .filter((line) => !/(\d+\s*(грн|₴)|ціна|цена|роздріб|дроп|опт[ова])/i.test(line))
      .join('\n')
      .trim()
  }

  function openOrderDialog(type: OrderType, color = '') {
    setOrderType(type)
    setSelectedColor(color || colors[0]?.color || '')
    setOrderDialogOpen(true)
  }

  const stockBadge = (() => {
    if (product.stock_status === 'in_stock' || product.stock_status === 'low_stock') {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
          <CheckCircle className="h-4 w-4" />
          {t(locale, `catalog.${product.stock_status}`)}
        </span>
      )
    }
    if (product.stock_status === 'preorder') {
      return (
        <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium">
          <CheckCircle className="h-4 w-4" />
          {t(locale, 'catalog.preorder')}
        </span>
      )
    }
    return (
      <span className="text-sm text-muted-foreground">{t(locale, 'catalog.out_of_stock')}</span>
    )
  })()

  return (
    <div className="space-y-6">
      {/* Product identity */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          {t(locale, 'product.code')}: {product.code}
        </p>
        <h1 className="text-3xl font-bold mb-3">{name}</h1>
        {stockBadge}
      </div>

      {description && (
        <p className="text-muted-foreground leading-relaxed">{cleanDescription(description)}</p>
      )}

      {/* Specs */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {material && (
          <div>
            <p className="text-muted-foreground">{t(locale, 'product.material')}</p>
            <p className="font-medium">{material}</p>
          </div>
        )}
        {product.size_text && (
          <div>
            <p className="text-muted-foreground">{t(locale, 'product.size')}</p>
            <p className="font-medium">{product.size_text}</p>
          </div>
        )}
      </div>

      {/* Color variants — retail price only */}
      {colors.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">{t(locale, 'product.colors')}</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((colorData: any, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedColor(colorData.color)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedColor === colorData.color
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                {colorData.color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary price — retail only */}
      <div className="pt-2 border-t">
        <p className="text-sm text-muted-foreground mb-1">{t(locale, 'product.retail_price')}</p>
        <p className="text-3xl font-bold">
          {formatPrice(
            colors.length > 0 && selectedColor
              ? (colors.find((c: any) => c.color === selectedColor)?.price_retail ??
                  product.price_retail)
              : product.price_retail,
          )}
        </p>
      </div>

      {/* Primary CTA */}
      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          onClick={() => openOrderDialog('retail', selectedColor)}
          disabled={product.stock_status === 'out_of_stock'}
        >
          {t(locale, 'product.order_retail')}
        </Button>

        {/* Trust hint */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            {locale === 'ru' ? 'Обмен 14 дней' : 'Обмін 14 днів'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {locale === 'ru' ? 'Отправка 1-2 дня' : 'Відправка 1-2 дні'}
          </span>
        </div>
      </div>

      {/* Reseller section — collapsed by default */}
      <div className="border-t pt-4">
        <button
          onClick={() => setShowReseller((v) => !v)}
          className="text-sm text-muted-foreground hover:text-black transition-colors underline-offset-2 hover:underline"
        >
          {t(locale, 'product.for_resellers')}
        </button>

        {showReseller && (
          <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t(locale, 'product.drop_price')}</span>
              <span className="font-semibold">{formatPrice(product.price_drop)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                variant="outline"
                onClick={() => openOrderDialog('drop', selectedColor)}
              >
                {t(locale, 'product.order_drop')}
              </Button>
              <Button
                className="flex-1"
                size="sm"
                variant="secondary"
                onClick={() => openOrderDialog('wholesale', selectedColor)}
              >
                {t(locale, 'product.request_wholesale')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        locale={locale}
        orderType={orderType}
        productCode={product.code}
        selectedColor={selectedColor}
        price={orderType === 'retail' ? product.price_retail : product.price_drop}
      />
    </div>
  )
}
