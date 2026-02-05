import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Truck, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

async function getFeaturedProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*, media:product_media(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6)

  return data || []
}

export default async function HomePage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale as Locale
  const products = await getFeaturedProducts()

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-background py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t(locale, 'home.hero_title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t(locale, 'home.hero_subtitle')}
            </p>
            <Button asChild size="lg">
              <Link href={`/${locale}/catalog`}>
                {t(locale, 'home.shop_now')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t(locale, 'home.featured_products')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/${locale}/product/${product.slug}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-4">
                  {product.media && product.media[0] ? (
                    <Image
                      src={product.media[0].url}
                      alt={product.name_uk}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <span className="text-4xl font-bold">{product.code}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                  {locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {t(locale, 'product.code')}: {product.code}
                </p>
                <p className="font-semibold">{formatPrice(product.price_retail)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t(locale, 'home.benefits_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="font-semibold mb-2">{t(locale, 'home.benefit_1_title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t(locale, 'home.benefit_1_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="font-semibold mb-2">{t(locale, 'home.benefit_2_title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t(locale, 'home.benefit_2_desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-semibold mb-2">{t(locale, 'home.benefit_3_title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t(locale, 'home.benefit_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
