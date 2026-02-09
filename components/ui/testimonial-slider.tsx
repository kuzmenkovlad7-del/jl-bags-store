'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Locale = 'uk' | 'ru';

interface TestimonialSliderProps {
  locale: Locale;
  items?: string[];
}

const FALLBACK_IMAGES = Array.from(
  { length: 10 },
  (_, i) => `/reviews/review-${String(i + 1).padStart(2, '0')}.jpg`
);

const AUTOPLAY_MS = 3200;
const TRANSITION_MS = 460;
const SWIPE_THRESHOLD = 40;

const getVisibleCount = (width: number): number => {
  if (width >= 1280) return 3;
  if (width >= 768) return 2;
  return 1;
};

const mod = (value: number, base: number): number => {
  return ((value % base) + base) % base;
};

export function TestimonialSlider({ locale, items }: TestimonialSliderProps) {
  const images = useMemo(() => {
    const cleaned = (items || []).filter(Boolean);
    return cleaned.length > 0 ? cleaned : FALLBACK_IMAGES;
  }, [items]);

  const baseLen = images.length;
  const slides = useMemo(() => [...images, ...images, ...images], [images]);

  const [visibleCount, setVisibleCount] = useState(1);
  const [index, setIndex] = useState(baseLen); // стартуем с центрального блока
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onResize = () => setVisibleCount(getVisibleCount(window.innerWidth));
    onResize();

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // если поменялся массив отзывов — корректно перецентрируем
    setIndex(baseLen);
  }, [baseLen]);

  useEffect(() => {
    if (baseLen <= 1) return;

    const id = window.setInterval(() => {
      setIndex((prev) => prev + 1);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [baseLen]);

  useEffect(() => {
    if (baseLen <= 1) return;

    let target: number | null = null;

    // ушли вправо за центральный блок
    if (index >= baseLen * 2) {
      target = baseLen + (index - baseLen * 2);
    }

    // ушли влево за центральный блок
    if (index < baseLen) {
      target = baseLen + (index - baseLen);
    }

    if (target === null) return;

    const t = window.setTimeout(() => {
      setTransitionEnabled(false);
      setIndex(target as number);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransitionEnabled(true));
      });
    }, TRANSITION_MS);

    return () => window.clearTimeout(t);
  }, [index, baseLen]);

  const goNext = () => setIndex((prev) => prev + 1);
  const goPrev = () => setIndex((prev) => prev - 1);
  const goTo = (dotIndex: number) => setIndex(baseLen + mod(dotIndex, baseLen));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current === null || startYRef.current === null) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= SWIPE_THRESHOLD) {
      if (dx < 0) goNext();
      else goPrev();
    }

    startXRef.current = null;
    startYRef.current = null;
  };

  const onPointerCancel = () => {
    startXRef.current = null;
    startYRef.current = null;
  };

  const itemWidth = 100 / visibleCount;
  const translateX = -(index * itemWidth);
  const activeDot = baseLen > 0 ? mod(index, baseLen) : 0;

  const title = locale === 'ru' ? 'Отзывы клиентов' : 'Відгуки клієнтів';
  const subtitle =
    locale === 'ru'
      ? 'Реальные отзывы наших клиентов'
      : 'Реальні відгуки наших клієнтів';

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container">
        <div className="mb-8 md:mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold">{title}</h2>
            <p className="mt-3 text-sm md:text-base text-gray-500">{subtitle}</p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              aria-label={locale === 'ru' ? 'Предыдущий отзыв' : 'Попередній відгук'}
            >
              <ChevronLeft className="mx-auto h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
              aria-label={locale === 'ru' ? 'Следующий отзыв' : 'Наступний відгук'}
            >
              <ChevronRight className="mx-auto h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
        >
          <div
            className="flex will-change-transform"
            style={{
              transform: `translate3d(${translateX}%, 0, 0)`,
              transition: transitionEnabled
                ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22,1,0.36,1)`
                : 'none',
            }}
          >
            {slides.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="px-2"
                style={{ flex: `0 0 ${itemWidth}%` }}
              >
                <div className="relative overflow-hidden rounded-2xl bg-gray-200 aspect-[10/14] sm:aspect-[10/13]">
                  <Image
                    src={src}
                    alt={`${locale === 'ru' ? 'Отзыв' : 'Відгук'} ${mod(i, baseLen) + 1}`}
                    fill
                    sizes={
                      visibleCount === 1
                        ? '100vw'
                        : visibleCount === 2
                        ? '50vw'
                        : '33vw'
                    }
                    className="object-cover"
                    priority={i < 3}
                  />
                  <div className="absolute inset-0 bg-black/12" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between md:hidden">
          <button
            type="button"
            onClick={goPrev}
            className="h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            aria-label={locale === 'ru' ? 'Предыдущий отзыв' : 'Попередній відгук'}
          >
            <ChevronLeft className="mx-auto h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="h-10 w-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
            aria-label={locale === 'ru' ? 'Следующий отзыв' : 'Наступний відгук'}
          >
            <ChevronRight className="mx-auto h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === activeDot ? 'w-6 bg-black' : 'w-2.5 bg-gray-300'
              }`}
              aria-label={`${locale === 'ru' ? 'Перейти к отзыву' : 'Перейти до відгуку'} ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialSlider;
