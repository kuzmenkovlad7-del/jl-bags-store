'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { POPULAR_PRODUCT_CODES } from '@/lib/featured-products'

type Props = { locale: Locale }

export function HomePopularSection({ locale }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (POPULAR_PRODUCT_CODES.length === 0) {
      setLoaded(true)
      return
    }

    let alive = true

    supabase
      .from('products')
      .select('*, media:product_media(*)')
      .eq('is_active', true)
      .in('code', POPULAR_PRODUCT_CODES)
      .limit(POPULAR_PRODUCT_CODES.length)
      .then(({ data }: { data: Product[] | null }) => {
        if (!alive) return
        const sorted = (data || []).sort(
          (a: any, b: any) =>
            POPULAR_PRODUCT_CODES.indexOf(a.code) - POPULAR_PRODUCT_CODES.indexOf(b.code),
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

  if (POPULAR_PRODUCT_CODES.length === 0 || !loaded || products.length === 0) return null

  const count = products.length
  const gridClass =
    count >= 4
      ? 'grid grid-cols-2 gap-6 md:grid-cols-4'
      : count === 3
      ? 'grid grid-cols-1 gap-6 sm:grid-cols-3'
      : count === 2
      ? 'grid grid-cols-2 gap-6 max-w-xl mx-auto'
      : 'grid grid-cols-1 gap-6 max-w-xs mx-auto'

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container">
        <div className="mb-8 flex items-start justify-between gap-4 md:mb-10">
          <h2 className="text-4xl font-bold text-black md:text-6xl">
            {locale === 'ru' ? 'Популярные модели' : 'Популярні моделі'}
          </h2>
          <Link
            href={`/${locale}/catalog`}
            className="hidden h-12 items-center rounded-xl border border-gray-300 px-5 text-base font-medium text-black transition-colors hover:bg-white md:inline-flex whitespace-nowrap"
          >
            {locale === 'ru' ? 'Смотреть все' : 'Дивитись все'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className={gridClass}>
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
                  {product.is_hit && !product.is_sale && !product.is_new && (
                    <span className="absolute top-2 left-2 rounded bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
                      {t(locale, 'catalog.flag_hit')}
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

        <div className="mt-8 md:hidden">
          <Link
            href={`/${locale}/catalog`}
            className="inline-flex h-12 items-center rounded-xl border border-gray-300 px-5 text-base font-medium text-black transition-colors hover:bg-white whitespace-nowrap"
          >
            {locale === 'ru' ? 'Смотреть все' : 'Дивитись все'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
