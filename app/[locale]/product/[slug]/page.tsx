export const dynamicParams = true
export const revalidate = 0
export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { ProductClient } from './product-client'
import { ProductMediaGallery } from './product-media-gallery'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const PRODUCT_SELECT = '*, media:product_media(*)'

function sortMedia(media: any[] | undefined) {
  if (!Array.isArray(media)) return []
  return [...media].sort((a, b) => {
    const aPrimary = Number(Boolean(a?.is_primary ?? a?.is_main ?? false))
    const bPrimary = Number(Boolean(b?.is_primary ?? b?.is_main ?? false))
    if (aPrimary !== bPrimary) return bPrimary - aPrimary
    return Number(a?.position ?? a?.sort_order ?? 0) - Number(b?.position ?? b?.sort_order ?? 0)
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
  const supabase = getSupabase()
  let q = supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).limit(1)
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q.maybeSingle()
  if (error) { console.error('[product] fetchBySlug', { slug, error: error.message }); return null }
  if (!data) return null
  return { ...(data as any), media: sortMedia((data as any).media) } as Product
}

async function fetchByCode(code: string, activeOnly: boolean): Promise<Product | null> {
  const supabase = getSupabase()
  let q = supabase.from('products').select(PRODUCT_SELECT).eq('code', code).limit(1)
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q.maybeSingle()
  if (error) { console.error('[product] fetchByCode', { code, error: error.message }); return null }
  if (!data) return null
  return { ...(data as any), media: sortMedia((data as any).media) } as Product
}

async function getProduct(slugRaw: string): Promise<Product | null> {
  const slug = normalizeSlug(slugRaw)
  return (
    (await fetchBySlug(slug, true))  ??
    (await fetchBySlug(slug, false)) ??
    (await (async () => {
      const code = extractCodeFromSlug(slug)
      if (!code) return null
      return (await fetchByCode(code, true)) ?? fetchByCode(code, false)
    })())
  )
}

async function getSimilarProducts(productId: string): Promise<Product[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .neq('id', productId)
    .limit(4)
  if (error) { console.error('[product] getSimilarProducts', error.message); return [] }
  return (data || []).map((p: any) => ({ ...p, media: sortMedia(p.media) })) as Product[]
}

function buildSeoTitle(product: Product, locale: Locale): string {
  if (product.seo_title) return product.seo_title
  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  return `${name} (арт. ${product.code}) — купити | JL`
}

function buildSeoDescription(product: Product, locale: Locale): string {
  if (product.seo_description) return product.seo_description
  const desc = locale === 'ru' && product.description_ru
    ? product.description_ru
    : product.description_uk
  if (desc && desc.trim().length > 20) return desc.slice(0, 155).trim() + (desc.length > 155 ? '…' : '')
  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  return `${name} ${product.code} JL: актуальні кольори, ціни, наявність. Замовлення через Direct або Telegram.`
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string }
}): Promise<Metadata> {
  const product = await getProduct(params.slug)
  if (!product) return { title: 'Товар не знайдено' }

  const locale      = params.locale as Locale
  const title       = buildSeoTitle(product, locale)
  const description = buildSeoDescription(product, locale)
  const primaryImg  = product.media?.find(m => m.is_primary) ?? product.media?.[0]
  const ogTitle     = product.og_title       || title
  const ogDesc      = product.og_description || description

  return {
    title,
    description,
    openGraph: {
      title:       ogTitle,
      description: ogDesc,
      ...(primaryImg ? { images: [{ url: primaryImg.url, width: 1200, height: 630, alt: product.name_uk }] } : {}),
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string; locale: string }
}) {
  const locale  = params.locale as Locale
  const product = await getProduct(params.slug)
  if (!product) notFound()

  const similarProducts = await getSimilarProducts(String(product.id))
  const name        = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  const h1          = product.seo_h1 || name
  const description = locale === 'ru' && product.description_ru ? product.description_ru : product.description_uk
  const primaryImg  = product.media?.find(m => m.is_primary) ?? product.media?.[0]

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <ProductMediaGallery product={product} locale={locale} name={h1} />
        <ProductClient product={product} locale={locale} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: h1,
            description: description,
            image: primaryImg?.url,
            sku: product.code,
            offers: {
              '@type': 'Offer',
              price: product.price_retail,
              priceCurrency: 'UAH',
              availability: `https://schema.org/${product.stock_status === 'in_stock' ? 'InStock' : 'OutOfStock'}`,
            },
          }),
        }}
      />

      {similarProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-8">{t(locale, 'product.similar')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(similar => {
              const similarName = locale === 'ru' && similar.name_ru ? similar.name_ru : similar.name_uk
              const similarImg  = similar.media?.find(m => m.is_primary) ?? similar.media?.[0]
              return (
                <Link key={similar.id} href={`/${locale}/product/${similar.slug}`} className="group">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                    {similarImg ? (
                      <Image
                        src={similarImg.url}
                        alt={similarName}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <span className="text-2xl font-bold">{similar.code}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{similarName}</h3>
                  <p className="text-sm text-muted-foreground">{formatPrice(similar.price_retail)}</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
