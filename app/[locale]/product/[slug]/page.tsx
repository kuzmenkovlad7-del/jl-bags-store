export const dynamicParams = true
export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { SITE_URL } from '@/lib/site'
import { ProductClient } from './product-client'
import { ProductMediaGallery } from './product-media-gallery'

const PRODUCT_SELECT = '*, media:product_media(*)'

function sortMedia(media: any[] | undefined) {
  if (!Array.isArray(media)) return []
  return [...media].sort((a, b) => {
    const aPrimary = Number(Boolean(a?.is_primary ?? a?.is_main ?? false))
    const bPrimary = Number(Boolean(b?.is_primary ?? b?.is_main ?? false))
    if (aPrimary !== bPrimary) return bPrimary - aPrimary
    const aPos = Number(a?.position ?? a?.sort_order ?? 0)
    const bPos = Number(b?.position ?? b?.sort_order ?? 0)
    return aPos - bPos
  })
}

function normalizeSlug(input: string) {
  return decodeURIComponent(String(input || '').trim()).toLowerCase()
}

function extractCodeFromSlug(slug: string): string | null {
  const m = slug.match(/(\d+)$/)
  return m ? m[1] : null
}

async function fetchBySlug(slug: string, activeOnly: boolean): Promise<Product | null> {
  let q = supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).limit(1)
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q.maybeSingle()
  if (error) {
    console.error('[product page] fetchBySlug error', { slug, activeOnly, error: error.message })
    return null
  }
  if (!data) return null
  return { ...(data as any), media: sortMedia((data as any).media) } as Product
}

async function fetchByCode(code: string, activeOnly: boolean): Promise<Product | null> {
  let q = supabase.from('products').select(PRODUCT_SELECT).eq('code', code).limit(1)
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q.maybeSingle()
  if (error) {
    console.error('[product page] fetchByCode error', { code, activeOnly, error: error.message })
    return null
  }
  if (!data) return null
  return { ...(data as any), media: sortMedia((data as any).media) } as Product
}

async function getProduct(slugRaw: string): Promise<Product | null> {
  const slug = normalizeSlug(slugRaw)

  let product = await fetchBySlug(slug, true)
  if (product) return product

  product = await fetchBySlug(slug, false)
  if (product) return product

  const code = extractCodeFromSlug(slug)
  if (code) {
    product = await fetchByCode(code, true)
    if (product) return product
    product = await fetchByCode(code, false)
    if (product) return product
  }

  return null
}

async function getSimilarProducts(productId: string, locale: Locale): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .neq('id', productId)
    .order('is_hit', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  if (error) {
    console.error('[product page] getSimilarProducts error', error.message)
    return []
  }

  return ((data || []).map((p: any) => ({ ...p, media: sortMedia(p.media) }))) as Product[]
}

function getAvailabilitySchema(stockStatus: string): string {
  switch (stockStatus) {
    case 'in_stock':
      return 'https://schema.org/InStock'
    case 'low_stock':
      return 'https://schema.org/LimitedAvailability'
    case 'preorder':
      return 'https://schema.org/PreOrder'
    default:
      return 'https://schema.org/OutOfStock'
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)
  const locale = params.locale as Locale

  if (!product) {
    return { title: 'Товар не знайдено | JL' }
  }

  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  const description =
    locale === 'ru' && product.description_ru ? product.description_ru : product.description_uk
  const primaryImage = product.media?.find((m) => m.is_primary && m.media_type === 'photo')
    ?? product.media?.find((m) => m.media_type === 'photo')

  // Keyword-rich title: name + brand + price signal
  const titleSuffix = locale === 'ru'
    ? `купить — Julia Lebedeva`
    : `купити — Julia Lebedeva`
  const title = `${name} | ${titleSuffix}`

  // Description: use product description if available, otherwise generate from attributes
  const metaDescription = description
    ? `${description}. ${locale === 'ru' ? 'Быстрая доставка по Украине. Обмен 14 дней.' : 'Швидка доставка по Україні. Обмін 14 днів.'}`
    : `${name}. ${locale === 'ru' ? 'Артикул' : 'Артикул'} ${product.code}. ${locale === 'ru' ? 'Быстрая доставка по Украине.' : 'Швидка доставка по Україні.'}`

  return {
    title,
    description: metaDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/product/${params.slug}`,
      languages: {
        uk: `${SITE_URL}/uk/product/${params.slug}`,
        ru: `${SITE_URL}/ru/product/${params.slug}`,
        'x-default': `${SITE_URL}/uk/product/${params.slug}`,
      },
    },
    openGraph: {
      title,
      description: metaDescription,
      type: 'website',
      locale: locale === 'ru' ? 'ru_UA' : 'uk_UA',
      ...(primaryImage ? { images: [{ url: primaryImage.url, alt: name }] } : {}),
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string; locale: string }
}) {
  const locale = params.locale as Locale
  const product = await getProduct(params.slug)

  if (!product) {
    notFound()
  }

  const similarProducts = await getSimilarProducts(String(product.id), locale)
  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  const description =
    locale === 'ru' && product.description_ru ? product.description_ru : product.description_uk
  const primaryImage = product.media?.find((m) => m.is_primary && m.media_type === 'photo')
    ?? product.media?.find((m) => m.media_type === 'photo')

  return (
    <div className="container py-8">
      {/* Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <ProductMediaGallery product={product} locale={locale} name={name} />
        <ProductClient product={product} locale={locale} />
      </div>

      {/* Product structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            description,
            sku: product.code,
            brand: {
              '@type': 'Brand',
              name: 'Julia Lebedeva',
            },
            ...(primaryImage ? { image: primaryImage.url } : {}),
            offers: {
              '@type': 'Offer',
              price: product.price_retail,
              priceCurrency: 'UAH',
              availability: getAvailabilitySchema(product.stock_status),
              seller: {
                '@type': 'Organization',
                name: 'Julia Lebedeva',
              },
            },
          }),
        }}
      />

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-8">{t(locale, 'product.similar')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map((similar) => {
              const similarName =
                locale === 'ru' && similar.name_ru ? similar.name_ru : similar.name_uk
              const displayMedia =
                similar.media?.find((m) => m.is_primary && m.media_type === 'photo') ??
                similar.media?.find((m) => m.media_type === 'photo')

              return (
                <Link
                  key={similar.id}
                  href={`/${locale}/product/${similar.slug}`}
                  className="group"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                    {displayMedia ? (
                      <img
                        src={displayMedia.url}
                        alt={similarName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <span className="text-2xl font-bold">{similar.code}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {similarName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(similar.price_retail)}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
