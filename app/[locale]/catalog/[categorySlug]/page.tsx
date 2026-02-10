import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import { type Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import type { Product, ProductMedia } from '@/lib/types'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '') || 'https://jl-bags.com'

interface Props {
  params: { locale: string; categorySlug: string }
  searchParams?: Record<string, string | string[] | undefined>
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = params.locale as Locale
  const supabase = createServerClient()

  const { data: category } = await supabase
    .from('categories')
    .select('slug, name_uk, name_ru, is_active')
    .eq('slug', params.categorySlug)
    .eq('is_active', true)
    .single()

  if (!category) return { title: 'Not found' }

  const name =
    locale === 'ru' && category.name_ru ? (category.name_ru as string) : (category.name_uk as string)
  const title = `${name} | Julia Lebedeva`
  const description =
    locale === 'ru'
      ? `Купить ${name} от Julia Lebedeva. Широкий выбор сумок и аксессуаров по доступным ценам.`
      : `Купити ${name} від Julia Lebedeva. Широкий вибір сумок та аксесуарів за доступними цінами.`

  const canonical = `${SITE_URL}/${locale}/catalog/${params.categorySlug}`
  const hasQuery = searchParams != null && Object.keys(searchParams).length > 0

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        uk: `${SITE_URL}/uk/catalog/${params.categorySlug}`,
        ru: `${SITE_URL}/ru/catalog/${params.categorySlug}`,
      },
    },
    ...(hasQuery ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CategoryPage({ params }: Props) {
  const locale = params.locale as Locale
  const supabase = createServerClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, slug, name_uk, name_ru, is_active')
    .eq('slug', params.categorySlug)
    .eq('is_active', true)
    .single()

  if (!category) notFound()

  const { data: pcRows } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', category.id as string)

  const productIds = (pcRows ?? []).map((r: { product_id: string }) => r.product_id)

  let products: Product[] = []
  if (productIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select('*, media:product_media(*)')
      .eq('is_active', true)
      .in('id', productIds)
      .order('created_at', { ascending: false })

    products = (data ?? []) as Product[]
  }

  const categoryName =
    locale === 'ru' && category.name_ru
      ? (category.name_ru as string)
      : (category.name_uk as string)

  return (
    <div className="container py-8">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">
          <Link href={`/${locale}/catalog`} className="hover:underline">
            {t(locale, 'catalog.title')}
          </Link>
          {' → '}
          {categoryName}
        </p>
        <h1 className="text-4xl font-bold">{categoryName}</h1>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {locale === 'ru'
            ? 'В этой категории пока нет товаров'
            : 'У цій категорії поки немає товарів'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const primaryMedia = product.media?.find((m: ProductMedia) => m.is_primary)
            const displayMedia = primaryMedia ?? product.media?.[0]
            const isVideo = displayMedia?.media_type === 'video'
            const productName =
              locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk

            return (
              <Link
                key={product.id}
                href={`/${locale}/product/${product.slug}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                  {displayMedia ? (
                    isVideo ? (
                      <video
                        src={displayMedia.url}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        muted
                        playsInline
                        preload="metadata"
                        loop
                      />
                    ) : (
                      <Image
                        src={displayMedia.url}
                        alt={productName}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span className="text-4xl font-bold">{product.code}</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.is_new && (
                      <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        {t(locale, 'catalog.flag_new')}
                      </span>
                    )}
                    {product.is_hit && (
                      <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        {t(locale, 'catalog.flag_hit')}
                      </span>
                    )}
                    {product.is_sale && (
                      <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                        {t(locale, 'catalog.flag_sale')}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {productName}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t(locale, 'product.code')}: {product.code}
                </p>
                <p className="font-semibold">{formatPrice(product.price_retail)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(locale, `catalog.${product.stock_status}`)}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
