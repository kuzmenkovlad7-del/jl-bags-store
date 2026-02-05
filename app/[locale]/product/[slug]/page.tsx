import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'
import { ProductClient } from './product-client'
import { ProductMediaGallery } from './product-media-gallery'

async function getProduct(slug: string): Promise<Product | null> {
  const { data } = await supabase
    .from('products')
    .select('*, media:product_media(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .order('is_primary', { foreignTable: 'product_media', ascending: false })
    .order('position', { foreignTable: 'product_media', ascending: true })
    .single()

  return data
}

async function getSimilarProducts(productId: string): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*, media:product_media(*)')
    .eq('is_active', true)
    .neq('id', productId)
    .limit(4)

  return data || []
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

  const similarProducts = await getSimilarProducts(product.id)
  const name = locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk
  const description =
    locale === 'ru' && product.description_ru
      ? product.description_ru
      : product.description_uk
  const material =
    locale === 'ru' && product.material_ru ? product.material_ru : product.material_uk

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <ProductMediaGallery product={product} locale={locale} name={name} />

        {/* Product Info */}
        <ProductClient product={product} locale={locale} />
      </div>

      {/* JSON-LD Schema */}
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

      {/* Similar Products */}
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
