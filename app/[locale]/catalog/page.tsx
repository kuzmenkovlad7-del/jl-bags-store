export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase/client'
import { Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import { CATEGORY_CONTENT } from '@/lib/category-content'
import CatalogClient from './catalog-client'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const locale = params.locale as Locale
  const isRu = locale === 'ru'
  const catSlug = typeof searchParams.category_slug === 'string'
    ? searchParams.category_slug
    : undefined

  if (catSlug) {
    // Config-driven title/description takes precedence (no DB call needed)
    const content = CATEGORY_CONTENT[catSlug]
    if (content?.seoTitle) {
      return {
        title: content.seoTitle[locale],
        description: content.seoDescription?.[locale],
        alternates: {
          canonical: `${SITE_URL}/${locale}/catalog?category_slug=${catSlug}`,
          languages: {
            uk: `${SITE_URL}/uk/catalog?category_slug=${catSlug}`,
            ru: `${SITE_URL}/ru/catalog?category_slug=${catSlug}`,
            'x-default': `${SITE_URL}/uk/catalog?category_slug=${catSlug}`,
          },
        },
      }
    }

    // Fallback: generate title from category name in DB
    const { data: cat } = await supabase
      .from('categories')
      .select('name_uk, name_ru')
      .eq('slug', catSlug)
      .eq('is_active', true)
      .maybeSingle()

    if (cat) {
      const catName = isRu && cat.name_ru ? cat.name_ru : cat.name_uk
      return {
        title: isRu
          ? `${catName} — купить | Julia Lebedeva`
          : `${catName} — купити | Julia Lebedeva`,
        description: isRu
          ? `${catName} в Украине. Широкий выбор, быстрая доставка по всей Украине. Оплата при получении.`
          : `${catName} в Україні. Широкий вибір, швидка доставка по всій Україні. Оплата при отриманні.`,
        alternates: {
          canonical: `${SITE_URL}/${locale}/catalog?category_slug=${catSlug}`,
          languages: {
            uk: `${SITE_URL}/uk/catalog?category_slug=${catSlug}`,
            ru: `${SITE_URL}/ru/catalog?category_slug=${catSlug}`,
            'x-default': `${SITE_URL}/uk/catalog?category_slug=${catSlug}`,
          },
        },
      }
    }
  }

  return {
    title: isRu
      ? 'Каталог — сумки та рюкзаки | Julia Lebedeva'
      : 'Каталог — сумки та рюкзаки | Julia Lebedeva',
    description: isRu
      ? 'Весь каталог сумок и рюкзаков Julia Lebedeva. Широкий выбор моделей, быстрая доставка по Украине.'
      : 'Весь каталог сумок та рюкзаків Julia Lebedeva. Широкий вибір моделей, швидка доставка по Україні.',
    alternates: {
      canonical: `${SITE_URL}/${locale}/catalog`,
      languages: {
        uk: `${SITE_URL}/uk/catalog`,
        ru: `${SITE_URL}/ru/catalog`,
        'x-default': `${SITE_URL}/uk/catalog`,
      },
    },
  }
}

export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogClient />
    </Suspense>
  )
}
