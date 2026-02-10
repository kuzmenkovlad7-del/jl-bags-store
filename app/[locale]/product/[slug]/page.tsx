export const dynamicParams = true
export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { supabase } from '@/lib/supabase/client'
import { Product, Category } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
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

  if (activeOnly) {
    q = q.eq('is_active', true)
  }

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

  if (activeOnly) {
    q = q.eq('is_active', true)
  }

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

  // 1) slug + active
  let product = await fetchBySlug(slug, true)
  if (product) return product

  // 2) slug без active фильтра
  product = await fetchBySlug(slug, false)
  if (product) return product

  // 3) fallback по коду из slug
  const code = extractCodeFromSlug(slug)
  if (code) {
    product = await fetchByCode(code, true)
    if (product) return product

    product = await fetchByCode(code, false)
    if (product) return product
  }

  return null
}

async function getSimilarProducts(productId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .neq('id', productId)
    .limit(4)

  if (error) {
    console.error('[product page] getSimilarProducts error', error.message)
    return []
  }

  return (data || []).map((p: any) => ({ ...p, media: sortMedia(p.media) })) as Product[]
}

async function getProductCategories(productId: string): Promise<Category[]> {
  const { data } = await supabase
    .from('product_categories')
    .select('category:categories(id, slug, name_uk, name_ru, is_active, sort_order, created_at)')
    .eq('product_id', productId)

  if (!data) return []
  return (data as any[])
    .map((row) => row.category)
    .filter((c: any) => c && c.is_active === true) as Category[]
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)
  const locale = params.locale as Locale

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk

  return {
    title: `${name} - JL`,
    description: locale === 'ru' && product.description_ru ? product.description_ru : product.description_uk,
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

  const [similarProducts, productCategories] = await Promise.all([
    getSimilarProducts(String(product.id)),
    getProductCategories(String(product.id)),
  ])
  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  const description =
    locale === 'ru' && product.description_ru
      ? product.description_ru
      : product.description_uk

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <ProductMediaGallery product={product} locale={locale} name={name} />
        <ProductClient product={product} locale={locale} categories={productCategories} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: name,
            description: description,
            image: product.media?.[0]?.url,
            sku: product.code,
            offers: {
              '@type': 'Offer',
              price: product.price_retail,
              priceCurrency: 'UAH',
              availability: `https://schema.org/${
                product.stock_status === 'in_stock' ? 'InStock' : 'OutOfStock'
              }`,
            },
          }),
        }}
      />

      {similarProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-8">{t(locale, 'product.similar')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map((similar) => (
              <Link
                key={similar.id}
                href={`/${locale}/product/${similar.slug}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                  {similar.media && similar.media[0] ? (
                    <Image
                      src={similar.media[0].url}
                      alt={similar.name_uk}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span className="text-2xl font-bold">{similar.code}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {locale === 'ru' && similar.name_ru
                    ? similar.name_ru
                    : similar.name_uk}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(similar.price_retail)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
