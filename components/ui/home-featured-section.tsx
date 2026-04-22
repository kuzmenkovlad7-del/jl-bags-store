'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { FEATURED_PRODUCT_SLUGS } from '@/lib/featured-products'

type Props = { locale: Locale }

export function HomeFeaturedSection({ locale }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (FEATURED_PRODUCT_SLUGS.length === 0) {
      setLoaded(true)
      return
    }

    let alive = true

    supabase
      .from('products')
      .select('*, media:product_media(*)')
      .eq('is_active', true)
      .in('slug', FEATURED_PRODUCT_SLUGS)
      .limit(FEATURED_PRODUCT_SLUGS.length)
      .then(({ data }: { data: Product[] | null }) => {
        if (!alive) return
        const sorted = (data || []).sort(
          (a: any, b: any) =>
            FEATURED_PRODUCT_SLUGS.indexOf(a.slug) - FEATURED_PRODUCT_SLUGS.indexOf(b.slug),
        )
        setProducts(sorted as Product[])
        setLoaded(true)
      })
      .catch(() => {
        if (alive) setLoaded(true)
      })

    return () => {
      alive = false
    }
  }, [])

  // Don't render if: not configured, not yet loaded, or no matching active products found
  if (FEATURED_PRODUCT_SLUGS.length === 0 || !loaded || products.length === 0) return null

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          {locale === 'ru' ? 'Рекомендуем' : 'Рекомендуємо'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => {
            const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
            const media =
              product.media?.find((m) => m.is_primary && m.media_type === 'photo') ??
              product.media?.find((m) => m.media_type === 'photo')

            return (
              <Link key={product.id} href={`/${locale}/product/${product.slug}`} className="group">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
                  {media ? (
                    <Image
                      src={media.url}
                      alt={name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <span className="text-4xl font-bold">{product.code}</span>
                    </div>
                  )}
                  {product.is_sale && (
                    <span className="absolute top-2 left-2 rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      {t(locale, 'catalog.flag_sale')}
                    </span>
                  )}
                  {product.is_new && !product.is_sale && (
                    <span className="absolute top-2 left-2 rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                      {t(locale, 'catalog.flag_new')}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold leading-snug mb-1 transition-colors group-hover:text-primary">
                  {name}
                </h3>
                <p className="font-semibold">{formatPrice(product.price_retail)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(locale, `catalog.${product.stock_status}`)}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
