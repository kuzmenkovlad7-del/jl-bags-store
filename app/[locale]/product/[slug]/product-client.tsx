'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { OrderDialog } from '@/components/order-dialog'
import { OrderType } from '@/lib/types'

interface ProductClientProps {
  product: Product
  locale: Locale
}

export function ProductClient({ product, locale }: ProductClientProps) {
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderType, setOrderType] = useState<OrderType>('retail')
  const [selectedColor, setSelectedColor] = useState('')

  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  const description =
    locale === 'ru' && product.description_ru
      ? product.description_ru
      : product.description_uk
  const material =
    locale === 'ru' && product.material_ru ? product.material_ru : product.material_uk

  const colors = product.colors_json || []

  function openOrderDialog(type: OrderType, color: string = '') {
    setOrderType(type)
    setSelectedColor(color || (colors[0]?.color || ''))
    setOrderDialogOpen(true)
  }

  const currentPrice =
    orderType === 'retail' ? product.price_retail : product.price_drop

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          {t(locale, 'product.code')}: {product.code}
        </p>
        <h1 className="text-3xl font-bold mb-4">{name}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">{t(locale, 'product.material')}</h3>
        <p>{material}</p>
      </div>

      <div>
        <h3 className="font-semibold mb-2">{t(locale, 'product.size')}</h3>
        <p>{product.size_text}</p>
      </div>

      {colors.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">{t(locale, 'product.colors')}</h3>
          <div className="space-y-2">
            {colors.map((colorData: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <span>{colorData.color}</span>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(colorData.price_retail)} /{' '}
                  {formatPrice(colorData.price_drop)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {t(locale, 'product.retail_price')}
          </p>
          <p className="text-2xl font-bold">{formatPrice(product.price_retail)}</p>
        </div>
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {t(locale, 'product.drop_price')}
          </p>
          <p className="text-2xl font-bold">{formatPrice(product.price_drop)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          onClick={() => openOrderDialog('retail')}
        >
          {t(locale, 'product.order_retail')}
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="outline"
          onClick={() => openOrderDialog('drop')}
        >
          {t(locale, 'product.order_drop')}
        </Button>
        <Button
          className="w-full"
          size="lg"
          variant="secondary"
          onClick={() => openOrderDialog('wholesale')}
        >
          {t(locale, 'product.request_wholesale')}
        </Button>
      </div>

      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        locale={locale}
        orderType={orderType}
        productCode={product.code}
        selectedColor={selectedColor}
        price={currentPrice}
      />
    </div>
  )
}
