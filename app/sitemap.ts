import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jl-bags.vercel.app'
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
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.8,
      })
    }

    if (products) {
      for (const product of products) {
        routes.push({
          url: `${baseUrl}/${locale}/product/${product.slug}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: 'daily',
          priority: 0.9,
        })
      }
    }
  }

  return routes
}
