'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface TravelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  imageAlt: string;
  logo?: React.ReactNode;
  title: string;
  location: string;
  overview: string;
  price: number;
  pricePeriod: string;
  ctaLabel?: string;
  onBookNow: () => void;
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('uk-UA').format(value);
};

const TravelCard = React.forwardRef<HTMLDivElement, TravelCardProps>(
  (
    {
      className,
      imageUrl,
      imageAlt,
      logo,
      title,
      location,
      overview,
      price,
      pricePeriod,
      ctaLabel = 'Дивитись',
      onBookNow,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
          'transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl',
          className
        )}
        {...props}
      >
        <img
          src={imageUrl}
          alt={imageAlt}
          className='absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110'
          loading='lazy'
        />

        <div className='absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10' />

        <div className='relative flex h-full flex-col justify-between p-5 text-card-foreground md:p-6'>
          <div className='flex h-20 items-start'>
            {logo && (
              <div className='flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/25 backdrop-blur-sm'>
                {logo}
              </div>
            )}
          </div>

          <div className='space-y-3 transition-transform duration-500 ease-in-out group-hover:-translate-y-12'>
            <div>
              <h3 className='line-clamp-2 text-2xl font-bold leading-tight text-white md:text-3xl'>{title}</h3>
              <p className='mt-1 text-sm text-white/85'>{location}</p>
            </div>

            <div>
              <h4 className='text-xs font-semibold tracking-wide text-white/90'>ОПИС</h4>
              <p className='line-clamp-3 text-sm leading-relaxed text-white/75'>{overview}</p>
            </div>
          </div>

          <div className='absolute -bottom-24 left-0 w-full p-5 opacity-0 transition-all duration-500 ease-in-out group-hover:bottom-0 group-hover:opacity-100 md:p-6'>
            <div className='flex items-end justify-between gap-3'>
              <div>
                <span className='text-3xl font-bold text-white md:text-4xl'>{formatNumber(price)}</span>
                <span className='ml-2 text-white/85'>{pricePeriod}</span>
              </div>
              <Button
                onClick={onBookNow}
                size='lg'
                className='bg-white text-black hover:bg-white/90'
              >
                {ctaLabel} <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TravelCard.displayName = 'TravelCard';

export { TravelCard };
