'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FullScreenScrollFX, FullScreenFXAPI } from '@/components/ui/full-screen-scroll-fx'

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
  autoplayInterval?: number
}

const fallbackSlides: HeroSlide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1591348122449-8d3d3f6f88f7?auto=format&fit=crop&w=1800&q=80',
    title: 'ЖІНОЧІ СУМКИ',
    subtitle: 'Преміальна якість від JL',
    badge: '01',
    ctaText: 'До каталогу',
    ctaHref: '/uk/catalog',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1614179689702-355944cd0918?auto=format&fit=crop&w=1800&q=80',
    title: 'НОВА КОЛЕКЦІЯ',
    subtitle: 'Відкрийте для себе унікальні моделі',
    badge: '02',
    ctaText: 'Дивитися новинки',
    ctaHref: '/uk/catalog',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1800&q=80',
    title: 'СТИЛЬ ТА ЯКІСТЬ',
    subtitle: 'Сумки для особливих моментів',
    badge: '03',
    ctaText: 'Обрати модель',
    ctaHref: '/uk/catalog',
  },
]

export default function HeroSlider({ slides = fallbackSlides, className, autoplayInterval }: HeroSliderProps) {
  const safeSlides = slides.length ? slides : fallbackSlides
  const [active, setActive] = React.useState(0)
  const apiRef = React.useRef<FullScreenFXAPI>(null)

  const current = safeSlides[Math.min(active, safeSlides.length - 1)] ?? safeSlides[0]

  const sections = safeSlides.map((s, i) => ({
    id: s.id ?? String(i + 1),
    background: s.image,
    leftLabel: `• ${String(i + 1).padStart(2, '0')}`,
    title: s.title,
    rightLabel: undefined as React.ReactNode,
  }))

  React.useEffect(() => {
    if (!autoplayInterval || autoplayInterval <= 0) return
    const timer = setInterval(() => {
      const next = (apiRef.current?.getIndex() ?? 0) + 1
      if (next >= safeSlides.length) apiRef.current?.goTo(0)
      else apiRef.current?.goTo(next)
    }, autoplayInterval)
    return () => clearInterval(timer)
  }, [autoplayInterval, safeSlides.length])

  return (
    <section className={className}>
      <FullScreenScrollFX
        apiRef={apiRef}
        sections={sections}
        onIndexChange={setActive}
        header={
          <>
            <div>Julia Lebedeva</div>
            <div>Collection</div>
          </>
        }
        footer={
          <div className='flex flex-col items-center gap-5 normal-case'>
            {current?.subtitle ? (
              <p className='max-w-3xl px-4 text-center text-white/90 text-base md:text-2xl'>
                {current.subtitle}
              </p>
            ) : null}

            <Link
              href={current?.ctaHref || '/uk/catalog'}
              className='inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-black text-sm md:text-base font-semibold hover:bg-white/90 transition'
            >
              {current?.ctaText || 'До каталогу'}
              <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
        }
        showProgress
        durations={{ change: 0.7, snap: 800 }}
        colors={{
          text: 'rgba(255,255,255,0.96)',
          overlay: 'rgba(0,0,0,0.45)',
          pageBg: '#000000',
          stageBg: '#000000',
        }}
      />
    </section>
  )
}
