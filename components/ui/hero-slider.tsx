'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import FullScreenScrollFX from '@/components/ui/full-screen-scroll-fx'

type Locale = 'uk' | 'ru'

type HeroSliderProps = {
 locale?: Locale
 slides?: unknown
}

const heroByLocale: Record<Locale, any[]> = {
 uk: [
  {
   id: 's1',
   leftLabel: 'ПРЕМІУМ',
   title: 'ЖІНОЧІ СУМКИ',
   rightLabel: 'ЯКІСТЬ',
   ctaLabel: 'ПЕРЕГЛЯНУТИ КОЛЕКЦІЮ',
   ctaHref: '/uk/catalog',
   background: '/slide-1.jpg',
  },
  {
   id: 's2',
   leftLabel: 'ЖІНОЧІ',
   title: 'НОВА КОЛЕКЦІЯ',
   rightLabel: 'СУМКИ',
   ctaLabel: 'ОБРАТИ МОДЕЛЬ',
   ctaHref: '/uk/catalog',
   background: '/slide-2.jpg',
  },
  {
   id: 's3',
   leftLabel: 'НОВА',
   title: 'ПРЕМІУМ ЯКІСТЬ',
   rightLabel: 'КОЛЕКЦІЯ',
   ctaLabel: 'ПЕРЕЙТИ В КАТАЛОГ',
   ctaHref: '/uk/catalog',
   background: '/slide-3.jpg',
  },
 ],
 ru: [
  {
   id: 's1',
   leftLabel: 'ПРЕМИУМ',
   title: 'ЖЕНСКИЕ СУМКИ',
   rightLabel: 'КАЧЕСТВО',
   ctaLabel: 'СМОТРЕТЬ КОЛЛЕКЦИЮ',
   ctaHref: '/ru/catalog',
   background: '/slide-1.jpg',
  },
  {
   id: 's2',
   leftLabel: 'ЖЕНСКИЕ',
   title: 'НОВАЯ КОЛЛЕКЦИЯ',
   rightLabel: 'СУМКИ',
   ctaLabel: 'ВЫБРАТЬ МОДЕЛЬ',
   ctaHref: '/ru/catalog',
   background: '/slide-2.jpg',
  },
  {
   id: 's3',
   leftLabel: 'НОВАЯ',
   title: 'ПРЕМИУМ КАЧЕСТВО',
   rightLabel: 'КОЛЛЕКЦИЯ',
   ctaLabel: 'ПЕРЕЙТИ В КАТАЛОГ',
   ctaHref: '/ru/catalog',
   background: '/slide-3.jpg',
  },
 ],
}

export default function HeroSlider({ locale: localeProp, slides: _slides }: HeroSliderProps = {}) {
 const pathname = usePathname()
 const locale: Locale = localeProp ?? (pathname?.startsWith('/ru') ? 'ru' : 'uk')
 const sections = heroByLocale[locale]

 return (
  <section className="w-full">
   <FullScreenScrollFX
    sections={sections}
    header={
     <>
      <div>JULIA LEBEDEVA</div>
      <div>COLLECTION</div>
     </>
    }
    showProgress
    durations={{ change: 0.72, snap: 900 }}
    colors={{
     text: 'rgba(255,255,255,0.96)',
     overlay: 'rgba(0,0,0,0.30)',
     pageBg: '#000000',
     stageBg: '#000000',
    }}
    fontFamily='"Rubik", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
    headerFontFamily='"Inter", "Helvetica Neue", Arial, sans-serif'
    headerFontWeight={320}
   />
  </section>
 )
}
