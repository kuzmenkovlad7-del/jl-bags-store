'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import FullScreenScrollFX from '@/components/ui/full-screen-scroll-fx'

type HeroSlideInput = {
  image?: string
  title?: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  leftLabel?: string
  rightLabel?: string
}

type HeroSlide = {
  id: string
  background: string
  title: string
  subtitle: string
  ctaText: string
  ctaHref: string
  leftLabel: string
  rightLabel: string
}

interface HeroSliderProps {
  slides?: HeroSlideInput[]
  locale?: string
  className?: string
}

const fallbackBackgrounds = [
  '/home/hero/slide-1.jpg',
  '/home/hero/slide-2.jpg',
  '/home/hero/slide-3.jpg',
]

function defaults(localeKey: string): HeroSlide[] {
  const uk = localeKey !== 'ru'

  return [
    {
      id: '1',
      background: fallbackBackgrounds[0],
      title: uk ? 'СТИЛЬ ТА ЯКІСТЬ' : 'СТИЛЬ И КАЧЕСТВО',
      subtitle: uk ? 'Сумки для особливих моментів' : 'Сумки для особых моментов',
      ctaText: uk ? 'Обрати модель' : 'Выбрать модель',
      ctaHref: `/${localeKey}/catalog`,
      leftLabel: uk ? 'ПРЕМІУМ\nКОМФОРТ\n• НОВИЙ' : 'ПРЕМИУМ\nКОМФОРТ\n• НОВЫЙ',
      rightLabel: uk ? 'КОЛЕКЦІЯ\nСЕЗОН\n•' : 'КОЛЛЕКЦИЯ\nСЕЗОН\n•',
    },
    {
      id: '2',
      background: fallbackBackgrounds[1],
      title: uk ? 'НОВА КОЛЕКЦІЯ 2026' : 'НОВАЯ КОЛЛЕКЦИЯ 2026',
      subtitle: uk ? 'Відкрийте для себе унікальні моделі' : 'Откройте для себя уникальные модели',
      ctaText: uk ? 'Дивитися новинки' : 'Смотреть новинки',
      ctaHref: `/${localeKey}/catalog`,
      leftLabel: uk ? 'ПРЕМІУМ\nКОМФОРТ\n• НОВИЙ' : 'ПРЕМИУМ\nКОМФОРТ\n• НОВЫЙ',
      rightLabel: uk ? 'КОЛЕКЦІЯ\nСЕЗОН\n•' : 'КОЛЛЕКЦИЯ\nСЕЗОН\n•',
    },
    {
      id: '3',
      background: fallbackBackgrounds[2],
      title: uk ? 'URBAN ELEGANCE' : 'URBAN ELEGANCE',
      subtitle: uk ? 'Колекція для міського ритму' : 'Коллекция для городского ритма',
      ctaText: uk ? 'Перейти в каталог' : 'Перейти в каталог',
      ctaHref: `/${localeKey}/catalog`,
      leftLabel: uk ? 'SIGNATURE\nURBAN\n• ELEGANCE' : 'SIGNATURE\nURBAN\n• ELEGANCE',
      rightLabel: uk ? 'COLLECTION\nMOTION\n• ESSENTIAL' : 'COLLECTION\nMOTION\n• ESSENTIAL',
    },
  ]
}

export default function HeroSlider({ slides = [], locale = 'uk', className = '' }: HeroSliderProps) {
  const localeKey = locale === 'ru' ? 'ru' : 'uk'
  const [active, setActive] = useState(0)

  const normalized = useMemo(() => {
    const base = defaults(localeKey)

    return base.map((d, i) => {
      const s = slides[i]
      return {
        ...d,
        background: s?.image || d.background,
        title: s?.title || d.title,
        subtitle: s?.subtitle || d.subtitle,
        ctaText: s?.ctaText || d.ctaText,
        ctaHref: s?.ctaHref || d.ctaHref,
        leftLabel: (s?.leftLabel && s.leftLabel.trim()) || d.leftLabel,
        rightLabel: (s?.rightLabel && s.rightLabel.trim()) || d.rightLabel,
      }
    })
  }, [slides, localeKey])

  const sections = useMemo(
    () =>
      normalized.map((s) => ({
        id: s.id,
        background: s.background,
        title: s.title,
        leftLabel: s.leftLabel,
        rightLabel: s.rightLabel,
      })),
    [normalized]
  )

  const safeIndex = Math.max(0, Math.min(active, normalized.length - 1))
  const current = normalized[safeIndex]
  const rootClass = `${className} jl-hero-active-${safeIndex}`.trim()

  return (
    <section className={rootClass}>
      <FullScreenScrollFX
        sections={sections as any}
        onIndexChange={setActive}
        header={
          <>
            <div>JULIA LEBEDEVA</div>
            <div>COLLECTION</div>
          </>
        }
        footer={
          <div className="flex flex-col items-center gap-4 normal-case">
            <p className="max-w-3xl px-4 text-center text-white/90 text-base md:text-2xl normal-case">
              {current?.subtitle}
            </p>

            <Link
              href={current?.ctaHref || `/${localeKey}/catalog`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-black text-sm md:text-base font-semibold hover:bg-white/90 transition"
            >
              {current?.ctaText || (localeKey === 'ru' ? 'Перейти в каталог' : 'Перейти в каталог')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        }
        showProgress
        durations={{ change: 0.72, snap: 900 }}
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
