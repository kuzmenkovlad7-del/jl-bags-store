import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Call getSiteUrl() at request time so SITE_URL / NEXT_PUBLIC_SITE_URL env
  // vars are read fresh rather than using the module-level frozen constant.
  const SITE_URL = getSiteUrl()
  const locales = ['uk', 'ru']

  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)

  const staticPages = [
    '',
    '/catalog',
    '/delivery-payment',
    '/wholesale',
    '/contacts',
    '/privacy',
    '/terms',
  ]

  const routes: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of staticPages) {
      routes.push({
        url: `${SITE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.8,
      })
    }

    if (products) {
      for (const product of products) {
        routes.push({
          url: `${SITE_URL}/${locale}/product/${product.slug}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: 'daily',
          priority: 0.9,
        })
      }
    }
  }

  return routes
}
