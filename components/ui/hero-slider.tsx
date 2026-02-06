'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FullScreenScrollFX } from '@/components/ui/full-screen-scroll-fx'

export type HeroSlide = {
  id?: string
  image: string
  title: string
  subtitle?: string
  badge?: string
  ctaText?: string
  ctaHref?: string
}

export type HeroSliderProps = {
  slides?: HeroSlide[]
  className?: string
}

const defaultSlides: HeroSlide[] = [
  {
    id: '1',
    image: '/home/hero/slide-1.jpg',
    title: 'Жіночі сумки',
    subtitle: 'Преміальна якість від JL',
    badge: 'Premium',
    ctaText: 'До каталогу',
    ctaHref: '/uk/catalog',
  },
  {
    id: '2',
    image: '/home/hero/slide-2.jpg',
    title: 'Стиль на щодень',
    subtitle: 'Моделі для міста та подорожей',
    badge: 'Collection',
    ctaText: 'Переглянути',
    ctaHref: '/uk/catalog',
  },
  {
    id: '3',
    image: '/home/hero/slide-3.jpg',
    title: 'Нова колекція',
    subtitle: 'Вишукані форми та фактури',
    badge: '2026',
    ctaText: 'Обрати модель',
    ctaHref: '/uk/catalog',
  },
]

export default function HeroSlider({ slides, className }: HeroSliderProps) {
  const safeSlides = slides && slides.length ? slides : defaultSlides
  const [active, setActive] = React.useState(0)
  const current = safeSlides[Math.min(active, safeSlides.length - 1)] ?? safeSlides[0]

  const sections = safeSlides.map((s, i) => ({
    id: s.id ?? String(i + 1),
    background: s.image,
    leftLabel: s.badge ?? `0${i + 1}`,
    title: s.title,
    rightLabel: s.subtitle ?? 'Julia Lebedeva',
  }))

  return (
    <section className={className}>
      <FullScreenScrollFX
        sections={sections}
        onIndexChange={setActive}
        header={
          <>
            <div>Julia Lebedeva</div>
            <div>Collection</div>
          </>
        }
        footer={
          <div className="flex flex-col items-center gap-5 normal-case">
            {current?.subtitle ? (
              <p className="max-w-3xl px-4 text-center text-white/85 text-base md:text-2xl">
                {current.subtitle}
              </p>
            ) : null}

            <Link
              href={current?.ctaHref || '/uk/catalog'}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-black text-sm md:text-base font-semibold hover:bg-white/90 transition"
            >
              {current?.ctaText || 'До каталогу'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        }
        showProgress
        durations={{ change: 0.7, snap: 800 }}
        colors={{
          text: 'rgba(255,255,255,0.95)',
          overlay: 'rgba(0,0,0,0.45)',
          pageBg: '#000000',
          stageBg: '#000000',
        }}
      />
    </section>
  )
}
