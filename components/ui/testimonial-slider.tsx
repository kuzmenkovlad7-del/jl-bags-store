'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

type Locale = 'uk' | 'ru'

interface Testimonial {
  id: number
  image: string
  name_uk: string
  name_ru: string
  text_uk: string
  text_ru: string
}

interface TestimonialSliderProps {
  locale: Locale
  items?: Testimonial[]
}

const defaultItems: Testimonial[] = [
  {
    id: 1,
    image: '/reviews/review-01.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Швидка доставка, гарна якість та дуже приємний сервіс.',
    text_ru: 'Быстрая доставка, отличное качество и очень приятный сервис.',
  },
  {
    id: 2,
    image: '/reviews/review-02.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Сумка виглядає стильно, вживу ще краща ніж на фото.',
    text_ru: 'Сумка выглядит стильно, вживую еще лучше, чем на фото.',
  },
  {
    id: 3,
    image: '/reviews/review-03.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Дуже зручна модель на кожен день, рекомендую.',
    text_ru: 'Очень удобная модель на каждый день, рекомендую.',
  },
  {
    id: 4,
    image: '/reviews/review-04.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Матеріал і фурнітура на високому рівні.',
    text_ru: 'Материал и фурнитура на высоком уровне.',
  },
  {
    id: 5,
    image: '/reviews/review-05.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Дякую за консультацію, підібрали ідеальний варіант.',
    text_ru: 'Спасибо за консультацию, помогли подобрать идеальный вариант.',
  },
  {
    id: 6,
    image: '/reviews/review-06.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Замовляю не вперше, завжди все якісно.',
    text_ru: 'Заказываю не впервые, всегда все качественно.',
  },
  {
    id: 7,
    image: '/reviews/review-07.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Колір і форма повністю як очікувала.',
    text_ru: 'Цвет и форма полностью как ожидала.',
  },
  {
    id: 8,
    image: '/reviews/review-08.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Покупкою задоволена на всі 100%.',
    text_ru: 'Покупкой довольна на все 100%.',
  },
  {
    id: 9,
    image: '/reviews/review-09.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Дуже гарне пакування і швидке відправлення.',
    text_ru: 'Очень аккуратная упаковка и быстрая отправка.',
  },
  {
    id: 10,
    image: '/reviews/review-10.jpg',
    name_uk: 'Клієнтка Julia Lebedeva',
    name_ru: 'Клиентка Julia Lebedeva',
    text_uk: 'Точно повернусь ще за новою моделлю.',
    text_ru: 'Точно вернусь еще за новой моделью.',
  },
]

const getVisibleCount = (width: number) => {
  if (width >= 1280) return 3
  if (width >= 768) return 2
  return 1
}

export function TestimonialSlider({ locale, items }: TestimonialSliderProps) {
  const data = useMemo(() => (items?.length ? items : defaultItems), [items])

  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const [index, setIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const visible = getVisibleCount(width)
  const maxIndex = Math.max(0, data.length - visible)
  const canPrev = index > 0
  const canNext = index < maxIndex

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }, 4500)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [maxIndex])

  const goPrev = () => setIndex((prev) => Math.max(0, prev - 1))
  const goNext = () => setIndex((prev) => Math.min(maxIndex, prev + 1))

  const title = locale === 'ru' ? 'Отзывы клиентов' : 'Відгуки клієнтів'
  const subtitle =
    locale === 'ru'
      ? 'Реальные отзывы с фото от наших покупателей'
      : 'Реальні відгуки з фото від наших покупців'

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container">
        <div className="mb-10 md:mb-14 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold">{title}</h2>
            <p className="mt-3 text-gray-500 text-base md:text-lg">{subtitle}</p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={!canPrev}
              className={`h-11 w-11 rounded-xl border transition ${
                canPrev ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
              aria-label={locale === 'ru' ? 'Предыдущий отзыв' : 'Попередній відгук'}
            >
              <ChevronLeft className="mx-auto h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              disabled={!canNext}
              className={`h-11 w-11 rounded-xl border transition ${
                canNext ? 'border-gray-300 hover:bg-gray-50' : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
              aria-label={locale === 'ru' ? 'Следующий отзыв' : 'Наступний відгук'}
            >
              <ChevronRight className="mx-auto h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: `-${index * (100 / visible)}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
          >
            {data.map((item) => {
              const name = locale === 'ru' ? item.name_ru : item.name_uk
              const text = locale === 'ru' ? item.text_ru : item.text_uk

              return (
                <div
                  key={item.id}
                  className={`flex-shrink-0 p-2 w-full ${
                    visible === 3 ? 'md:w-1/3' : visible === 2 ? 'md:w-1/2' : 'w-full'
                  }`}
                >
                  <article className="h-full rounded-2xl border border-gray-200 bg-white overflow-hidden">
                    <div className="relative aspect-[9/16] bg-gray-100">
                      <Image
                        src={item.image}
                        alt={name}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      />
                    </div>

                    <div className="p-5">
                      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        <Quote className="h-4 w-4 text-gray-700" />
                      </div>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">{text}</p>
                      <p className="mt-4 font-semibold text-black">{name}</p>
                    </div>
                  </article>
                </div>
              )
            })}
          </motion.div>
        </div>

        <div className="mt-6 flex md:hidden items-center justify-center gap-2">
          <button
            onClick={goPrev}
            disabled={!canPrev}
            className={`h-10 w-10 rounded-lg border ${
              canPrev ? 'border-gray-300' : 'border-gray-200 text-gray-300'
            }`}
            aria-label={locale === 'ru' ? 'Предыдущий отзыв' : 'Попередній відгук'}
          >
            <ChevronLeft className="mx-auto h-5 w-5" />
          </button>
          <button
            onClick={goNext}
            disabled={!canNext}
            className={`h-10 w-10 rounded-lg border ${
              canNext ? 'border-gray-300' : 'border-gray-200 text-gray-300'
            }`}
            aria-label={locale === 'ru' ? 'Следующий отзыв' : 'Наступний відгук'}
          >
            <ChevronRight className="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default TestimonialSlider
