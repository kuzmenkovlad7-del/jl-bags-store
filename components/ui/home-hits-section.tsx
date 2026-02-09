'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Locale = 'uk' | 'ru';

type ProductRow = {
  id: string | number;
  slug?: string | null;
  code?: string | number | null;
  image_url?: string | null;
  image?: string | null;
  name_uk?: string | null;
  name_ru?: string | null;
  description_uk?: string | null;
  description_ru?: string | null;
  name?: string | null;
  description?: string | null;
  price_retail?: number | string | null;
  price?: number | string | null;
  is_active?: boolean | null;
  in_stock?: boolean | null;
};

interface HomeHitsSectionProps {
  locale: Locale;
  products?: ProductRow[] | null;
  maxItems?: number;
}

const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const pickName = (p: ProductRow, locale: Locale): string => {
  if (locale === 'ru') return p.name_ru || p.name_uk || p.name || `Товар ${p.code ?? ''}`.trim();
  return p.name_uk || p.name_ru || p.name || `Товар ${p.code ?? ''}`.trim();
};

const pickDescription = (p: ProductRow, locale: Locale): string => {
  if (locale === 'ru') return p.description_ru || p.description_uk || p.description || '';
  return p.description_uk || p.description_ru || p.description || '';
};

const pickImage = (p: ProductRow): string => p.image_url || p.image || '';

const normalizeTop = (rows: ProductRow[], maxItems: number): ProductRow[] => {
  return rows
    .filter((p) => p && (p.is_active === true || p.is_active === null || p.is_active === undefined))
    .sort((a, b) => toNumber(b.price_retail ?? b.price) - toNumber(a.price_retail ?? a.price))
    .slice(0, maxItems);
};

export function HomeHitsSection({ locale, products, maxItems = 4 }: HomeHitsSectionProps) {
  const [rows, setRows] = useState<ProductRow[]>(Array.isArray(products) ? products : []);
  const [loading, setLoading] = useState<boolean>(!Array.isArray(products) || products.length === 0);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (Array.isArray(products) && products.length > 0) {
        setRows(products);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select(
          'id,slug,code,image_url,image,name_uk,name_ru,description_uk,description_ru,name,description,price_retail,price,is_active,in_stock'
        )
        .limit(300);

      if (!alive) return;

      setRows(Array.isArray(data) ? (data as ProductRow[]) : []);
      setLoading(false);
    }

    run();
    return () => {
      alive = false;
    };
  }, [products]);

  const hits = useMemo(() => normalizeTop(rows, maxItems), [rows, maxItems]);

  const title = locale === 'ru' ? 'Новые поступления и хиты' : 'Нові надходження та хіти';
  const ctaAll = locale === 'ru' ? 'Смотреть все' : 'Дивитись все';
  const articleLabel = locale === 'ru' ? 'Артикул' : 'Артикул';
  const inStockText = locale === 'ru' ? 'В наличии' : 'В наявності';
  const outStockText = locale === 'ru' ? 'Нет в наличии' : 'Немає в наявності';
  const emptyText = locale === 'ru' ? 'Товары скоро появятся' : 'Товари скоро зʼявляться';

  return (
    <section className='bg-gray-100 py-16 md:py-24'>
      <div className='mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8'>
        <div className='mb-8 flex items-start justify-between gap-4 md:mb-10'>
          <h2 className='max-w-[820px] text-4xl font-bold leading-[0.95] text-black md:text-7xl'>{title}</h2>

          <Link
            href={`/${locale}/catalog`}
            className='hidden h-14 items-center rounded-2xl border border-gray-300 px-7 text-4xl font-medium text-black transition-colors hover:bg-white md:inline-flex md:text-[40px] md:leading-none'
          >
            {ctaAll} <ArrowRight className='ml-3 h-8 w-8' />
          </Link>
        </div>

        {loading ? (
          <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='rounded-3xl border border-gray-200 p-4'>
                <div className='aspect-[4/5] animate-pulse rounded-2xl bg-gray-200' />
                <div className='mt-4 h-7 w-2/3 animate-pulse rounded bg-gray-200' />
                <div className='mt-3 h-5 w-1/2 animate-pulse rounded bg-gray-200' />
                <div className='mt-3 h-8 w-1/3 animate-pulse rounded bg-gray-200' />
              </div>
            ))}
          </div>
        ) : hits.length > 0 ? (
          <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
            {hits.map((p) => {
              const name = pickName(p, locale);
              const description = pickDescription(p, locale);
              const imageUrl = pickImage(p);
              const price = toNumber(p.price_retail ?? p.price);
              const code = p.code ?? p.id;
              const inStock = p.in_stock !== false;

              return (
                <Link
                  key={String(p.id)}
                  href={`/${locale}/catalog`}
                  className='group rounded-3xl border border-gray-200 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'
                >
                  <div className='relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-200'>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
                        loading='lazy'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center text-7xl font-semibold text-gray-500'>
                        {String(code)}
                      </div>
                    )}
                  </div>

                  <div className='mt-4'>
                    <h3 className='line-clamp-2 text-5xl font-bold leading-tight text-black md:text-6xl'>{name}</h3>

                    <p className='mt-2 text-3xl text-gray-500 md:text-4xl'>
                      {articleLabel}: {String(code)}
                    </p>

                    <p className='mt-2 text-6xl font-bold leading-none text-black md:text-7xl'>{price} грн</p>

                    <p className='mt-2 text-3xl text-gray-600 md:text-4xl'>{inStock ? inStockText : outStockText}</p>

                    {description ? (
                      <p className='mt-3 line-clamp-2 text-2xl text-gray-500 md:text-3xl'>{description}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className='flex h-44 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-xl text-gray-500'>
            {emptyText}
          </div>
        )}

        <div className='mt-8 md:hidden'>
          <Link
            href={`/${locale}/catalog`}
            className='inline-flex h-12 items-center rounded-xl border border-gray-300 px-5 text-base font-medium text-black transition-colors hover:bg-white whitespace-nowrap'
          >
            {ctaAll} <ArrowRight className='ml-2 h-4 w-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}
