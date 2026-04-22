'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Product } from '@/lib/types';
import { Locale, t } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';

type HomeHitsSectionProps = {
  locale: Locale;
  maxItems?: number;
};

export function HomeHitsSection({ locale, maxItems = 4 }: HomeHitsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadHits() {
      setLoading(true);

      try {
        // Primary query: bestsellers
        const { data: flagged, error: flaggedError } = await supabase
          .from('products')
          .select('*, media:product_media(*)')
          .eq('is_active', true)
          .eq('is_hit', true)
          .order('sort_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(maxItems);

        if (!alive) return;

        if (!flaggedError && flagged && flagged.length >= maxItems) {
          // Enough flagged products — use them directly
          setProducts(flagged as Product[]);
          return;
        }

        // Fallback: insufficient flagged products, load newest instead
        // (the newest query naturally includes flagged products too)
        const { data: newest } = await supabase
          .from('products')
          .select('*, media:product_media(*)')
          .eq('is_active', true)
          .order('sort_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(maxItems);

        if (!alive) return;

        setProducts((newest || []) as Product[]);
      } catch (e) {
        console.error('Home hits exception:', e);
        if (alive) setProducts([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadHits();

    return () => {
      alive = false;
    };
  }, [maxItems]);

  return (
    <section className="bg-gray-100 py-16 md:py-24">
      <div className="container">
        <div className="mb-8 flex items-start justify-between gap-4 md:mb-10">
          <h2 className="text-4xl font-bold text-black md:text-6xl">
            {locale === 'ru' ? 'Хиты продаж' : 'Хіти продажів'}
          </h2>

          <Link
            href={`/${locale}/catalog?flag=hit`}
            className="hidden h-12 items-center rounded-xl border border-gray-300 px-5 text-base font-medium text-black transition-colors hover:bg-white md:inline-flex whitespace-nowrap"
          >
            {locale === 'ru' ? 'Смотреть все' : 'Дивитись все'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i}>
                <div className="mb-4 aspect-square animate-pulse rounded-lg bg-gray-200" />
                <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.slice(0, maxItems).map((product) => {
              const primaryMedia = product.media?.find((m) => m.is_primary && m.media_type === 'photo');
              const firstMedia = product.media?.find((m) => m.media_type === 'photo');
              const displayMedia = primaryMedia || firstMedia;

              const productName =
                locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk;

              return (
                <Link
                  key={product.id}
                  href={`/${locale}/product/${product.slug}`}
                  className="group"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100">
                    {displayMedia ? (
                      <Image
                        src={displayMedia.url}
                        alt={productName}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <span className="text-4xl font-bold">{product.code}</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.is_new && (
                        <span className="rounded bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                          {t(locale, 'catalog.flag_new')}
                        </span>
                      )}
                      {product.is_hit && (
                        <span className="rounded bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
                          {t(locale, 'catalog.flag_hit')}
                        </span>
                      )}
                      {product.is_sale && (
                        <span className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                          {t(locale, 'catalog.flag_sale')}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="mb-1 font-semibold leading-snug transition-colors group-hover:text-primary">
                    {productName}
                  </h3>

                  <p className="font-semibold">{formatPrice(product.price_retail ?? 0)}</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(locale, `catalog.${product.stock_status}`)}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-xl text-gray-500">
            {locale === 'ru' ? 'Товары скоро появятся' : "Товари скоро з'являться"}
          </div>
        )}

        <div className="mt-8 md:hidden">
          <Link
            href={`/${locale}/catalog?flag=hit`}
            className="inline-flex h-12 items-center rounded-xl border border-gray-300 px-5 text-base font-medium text-black transition-colors hover:bg-white whitespace-nowrap"
          >
            {locale === 'ru' ? 'Смотреть все' : 'Дивитись все'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
