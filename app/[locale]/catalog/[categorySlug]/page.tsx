import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { type Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import type { Product, ProductMedia, Category } from '@/lib/types'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '') || 'https://jl-bags.com'

interface Props {
  params: { locale: string; categorySlug: string }
  searchParams?: Record<string, string | string[] | undefined>
}

/** Normalize a slug coming from the URL to match DB format */
function normalizeSlug(raw: string): string {
  return decodeURIComponent(raw).toLowerCase().trim()
}

/** Minimal alias map: old/alternative slug → canonical DB slug */
const SLUG_ALIASES: Record<string, string> = {
  'klatchy': 'klatch_krosbodi',
  'klatch': 'klatch_krosbodi',
  'sale': 'rozprodazh',
  'school': 'shkilnyi_ryukzak',
  'backpacks': 'ryukzak_tekstil',
  'wallets': 'gamanets_zhinochyi',
}

/**
 * Resolve a slug to a DB category.
 * 1. Exact match
 * 2. Hyphen ↔ underscore variant (e.g. "ryukzak-tekstil" → "ryukzak_tekstil")
 * 3. Alias map lookup
 */
async function findCategory(rawSlug: string): Promise<Category | null> {
  const slug = normalizeSlug(rawSlug)

  async function queryBySlug(s: string): Promise<Category | null> {
    const { data } = await supabase
      .from('categories')
      .select('id, slug, name_uk, name_ru, is_active, sort_order, created_at')
      .eq('slug', s)
      .eq('is_active', true)
      .single()
    return (data as Category) ?? null
  }

  // 1. Exact match
  const exact = await queryBySlug(slug)
  if (exact) return exact

  // 2. Hyphen ↔ underscore fallback
  const altSlug = slug.includes('-')
    ? slug.replace(/-/g, '_')
    : slug.replace(/_/g, '-')

  if (altSlug !== slug) {
    const alt = await queryBySlug(altSlug)
    if (alt) return alt
  }

  // 3. Alias map
  const aliasTarget = SLUG_ALIASES[slug] ?? SLUG_ALIASES[altSlug]
  if (aliasTarget) {
    return await queryBySlug(aliasTarget)
  }

  return null
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = params.locale as Locale
  const category = await findCategory(params.categorySlug)

  if (!category) return { title: 'Not found' }

  const name =
    locale === 'ru' && category.name_ru ? category.name_ru : category.name_uk
  const title = `${name} | Julia Lebedeva`
  const description =
    locale === 'ru'
      ? `Купить ${name} от Julia Lebedeva. Широкий выбор сумок и аксессуаров по доступным ценам.`
      : `Купити ${name} від Julia Lebedeva. Широкий вибір сумок та аксесуарів за доступними цінами.`

  // Canonical always points to the canonical DB slug (not the URL slug variant)
  const canonical = `${SITE_URL}/${locale}/catalog/${category.slug}`
  const hasQuery = searchParams != null && Object.keys(searchParams).length > 0

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        uk: `${SITE_URL}/uk/catalog/${category.slug}`,
        ru: `${SITE_URL}/ru/catalog/${category.slug}`,
      },
    },
    ...(hasQuery ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CategoryPage({ params }: Props) {
  const locale = params.locale as Locale
  const category = await findCategory(params.categorySlug)

  if (!category) notFound()

  // If request came in via non-canonical slug (e.g. hyphens instead of underscores),
  // redirect to the canonical slug URL so SEO is clean.
  const requestSlug = normalizeSlug(params.categorySlug)
  if (requestSlug !== category.slug) {
    redirect(`/${locale}/catalog/${category.slug}`)
  }

  const { data: pcRows } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', category.id)

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
    locale === 'ru' && category.name_ru ? category.name_ru : category.name_uk

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
