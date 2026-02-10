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

/** Alternate form: swap "-" ↔ "_" */
function altSlug(s: string): string {
  return s.includes('-') ? s.replace(/-/g, '_') : s.replace(/_/g, '-')
}

/**
 * Virtual categories mirror the home page visualCategories list.
 * Keys are underscore-normalized slugs.
 * These are used as a safety net: if a slug from the home page doesn't
 * exist in the DB yet, we still render the category page (with empty state)
 * instead of a 404.
 */
const VIRTUAL_CATEGORIES: Record<string, { name_uk: string; name_ru: string }> = {
  ryukzak_ekoshkira:    { name_uk: 'Рюкзак екошкіра',      name_ru: 'Рюкзак экокожа' },
  ryukzak_tekstil:      { name_uk: 'Рюкзак текстиль',       name_ru: 'Рюкзак текстиль' },
  shkilnyi_ryukzak:     { name_uk: 'Шкільний рюкзак',       name_ru: 'Школьный рюкзак' },
  klatch_krosbodi:      { name_uk: 'Клатч кросбоді',        name_ru: 'Клатч кроссбоди' },
  sumka_ekoshkira:      { name_uk: 'Сумка екошкіра',        name_ru: 'Сумка экокожа' },
  sumka_stobana:        { name_uk: 'Сумка стьобана',        name_ru: 'Сумка стеганая' },
  bananka:              { name_uk: 'Бананка',                name_ru: 'Бананка' },
  sumka_tekstil:        { name_uk: 'Сумка текстиль',        name_ru: 'Сумка текстиль' },
  rozprodazh:           { name_uk: 'Розпродаж',             name_ru: 'Распродажа' },
  cholovicha_sumka:     { name_uk: 'Чоловіча сумка',        name_ru: 'Мужская сумка' },
  gamanets_zhinochyi:   { name_uk: 'Гаманець жіночий',      name_ru: 'Кошелек женский' },
  gamanets_cholovichyi: { name_uk: 'Гаманець чоловічий',    name_ru: 'Кошелек мужской' },
}

/** Find a virtual category by slug (exact normalized key or "_"↔"-" variant) */
function findVirtualCategory(rawSlug: string): { name_uk: string; name_ru: string } | null {
  const slug = normalizeSlug(rawSlug)
  const alt  = altSlug(slug)
  return VIRTUAL_CATEGORIES[slug] ?? VIRTUAL_CATEGORIES[alt] ?? null
}

/** Minimal alias map: old/alternative slug → canonical DB slug */
const SLUG_ALIASES: Record<string, string> = {
  klatchy:   'klatch_krosbodi',
  klatch:    'klatch_krosbodi',
  sale:      'rozprodazh',
  school:    'shkilnyi_ryukzak',
  backpacks: 'ryukzak_tekstil',
  wallets:   'gamanets_zhinochyi',
}

/**
 * Resolve a slug to a DB category.
 * 1. Exact match
 * 2. Hyphen ↔ underscore variant
 * 3. Alias map lookup
 */
async function findCategory(rawSlug: string): Promise<Category | null> {
  const slug = normalizeSlug(rawSlug)
  const alt  = altSlug(slug)

  async function queryBySlug(s: string): Promise<Category | null> {
    const { data } = await supabase
      .from('categories')
      .select('id, slug, name_uk, name_ru, is_active, sort_order, created_at')
      .eq('slug', s)
      .eq('is_active', true)
      .single()
    return (data as Category) ?? null
  }

  const exact = await queryBySlug(slug)
  if (exact) return exact

  if (alt !== slug) {
    const altResult = await queryBySlug(alt)
    if (altResult) return altResult
  }

  const aliasTarget = SLUG_ALIASES[slug] ?? SLUG_ALIASES[alt]
  if (aliasTarget) {
    return await queryBySlug(aliasTarget)
  }

  return null
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = params.locale as Locale
  const category = await findCategory(params.categorySlug)

  // Use DB name if found; fall back to virtual category name; last resort 'Not found'
  const nameData = category
    ? { name_uk: category.name_uk, name_ru: category.name_ru ?? category.name_uk }
    : findVirtualCategory(params.categorySlug)

  if (!nameData) return { title: 'Not found' }

  const name = locale === 'ru' ? nameData.name_ru : nameData.name_uk
  const canonicalSlug = category?.slug ?? normalizeSlug(params.categorySlug)

  const title = `${name} | Julia Lebedeva`
  const description =
    locale === 'ru'
      ? `Купить ${name} от Julia Lebedeva. Широкий выбор сумок и аксессуаров по доступным ценам.`
      : `Купити ${name} від Julia Lebedeva. Широкий вибір сумок та аксесуарів за доступними цінами.`

  const canonical = `${SITE_URL}/${locale}/catalog/${canonicalSlug}`
  const hasQuery = searchParams != null && Object.keys(searchParams).length > 0

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        uk: `${SITE_URL}/uk/catalog/${canonicalSlug}`,
        ru: `${SITE_URL}/ru/catalog/${canonicalSlug}`,
      },
    },
    ...(hasQuery ? { robots: { index: false, follow: true } } : {}),
  }
}

// ---------------------------------------------------------------------------
// Empty-state helper (shared between real empty category and virtual category)
// ---------------------------------------------------------------------------

function EmptyState({ locale, categoryName }: { locale: Locale; categoryName: string }) {
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
      <div className="text-center py-12 text-muted-foreground">
        {locale === 'ru'
          ? 'В этой категории пока нет товаров'
          : 'У цій категорії поки немає товарів'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CategoryPage
// ---------------------------------------------------------------------------

export default async function CategoryPage({ params }: Props) {
  const locale = params.locale as Locale
  const category = await findCategory(params.categorySlug)

  if (!category) {
    // Before returning 404, check if this slug belongs to the home-page visual list.
    // Those categories always get a page (with empty state) even if not yet in the DB.
    const virtual = findVirtualCategory(params.categorySlug)
    if (!virtual) notFound()

    const categoryName = locale === 'ru' ? virtual.name_ru : virtual.name_uk
    return <EmptyState locale={locale} categoryName={categoryName} />
  }

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

  if (products.length === 0) {
    return <EmptyState locale={locale} categoryName={categoryName} />
  }

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
    </div>
  )
}
