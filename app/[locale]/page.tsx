'use client';

import { useState, useEffect } from 'react';
import { HomeFaqSection } from '@/components/ui/home-faq-section';
import { TestimonialSlider } from '@/components/ui/testimonial-slider';
import { AboutUsSection } from '@/components/ui/about-us-section';
import { HomeHitsSection } from '@/components/ui/home-hits-section';
import HeroSlider from '@/components/ui/hero-slider';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Truck, Award, HeadphonesIcon, Backpack, Wallet, ShoppingBag, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Locale, t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';

// Visual categories
const visualCategories = [
  { slug: 'ryukzak_ekoshkira', name_uk: 'Рюкзак екошкіра', name_ru: 'Рюкзак экокожа', icon: Backpack },
  { slug: 'ryukzak_tekstil', name_uk: 'Рюкзак текстиль', name_ru: 'Рюкзак текстиль', icon: Backpack },
  { slug: 'shkilnyi_ryukzak', name_uk: 'Шкільний рюкзак', name_ru: 'Школьный рюкзак', icon: Backpack },
  { slug: 'klatch_krosbodi', name_uk: 'Клатч кросбоді', name_ru: 'Клатч кроссбоди', icon: ShoppingBag },
  { slug: 'sumka_ekoshkira', name_uk: 'Сумка екошкіра', name_ru: 'Сумка экокожа', icon: ShoppingBag },
  { slug: 'sumka_stobana', name_uk: 'Сумка стьобана', name_ru: 'Сумка стеганая', icon: ShoppingBag },
  { slug: 'bananka', name_uk: 'Бананка', name_ru: 'Бананка', icon: Package },
  { slug: 'sumka_tekstil', name_uk: 'Сумка текстиль', name_ru: 'Сумка текстиль', icon: ShoppingBag },
  { slug: 'rozprodazh', name_uk: 'Розпродаж', name_ru: 'Распродажа', icon: Tag },
  { slug: 'cholovicha_sumka', name_uk: 'Чоловіча сумка', name_ru: 'Мужская сумка', icon: ShoppingBag },
  { slug: 'gamanets_zhinochyi', name_uk: 'Гаманець жіночий', name_ru: 'Кошелек женский', icon: Wallet },
  { slug: 'gamanets_cholovichyi', name_uk: 'Гаманець чоловічий', name_ru: 'Кошелек мужской', icon: Wallet },
];

/** Normalize slug for comparison: decode, lowercase, trim, hyphens → underscores */
function normalizeSlug(s: string): string {
  return decodeURIComponent(s).toLowerCase().trim().replace(/-/g, '_');
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;

  // null = not yet loaded → show all; Set = loaded from DB
  const [activeSlugs, setActiveSlugs] = useState<Set<string> | null>(null);

  useEffect(() => {
    supabase
      ?.from('categories')
      .select('slug')
      .eq('is_active', true)
      .then(({ data }: { data: Array<{ slug: string }> | null }) => {
        if (data && data.length > 0) {
          // Normalize DB slugs so hyphens and underscores both match
          setActiveSlugs(new Set(data.map((c) => normalizeSlug(c.slug))));
        }
        // On error or empty array → keep null → fallback to show all
      });
  }, []);

  // Filter visualCategories by active DB slugs (normalized); fallback to all if 0 results
  const filteredCategories =
    activeSlugs === null
      ? visualCategories
      : visualCategories.filter((c) => activeSlugs.has(normalizeSlug(c.slug)));
  const categories = filteredCategories.length > 0 ? filteredCategories : visualCategories;

  const heroSlides = [
    {
      image: '/home/hero/slide-1.jpg',
      title: t(locale, 'home.hero_title'),
      subtitle: t(locale, 'home.hero_subtitle'),
    },
    {
      image: '/home/hero/slide-2.jpg',
      title: locale === 'ru' ? 'Новая коллекция 2026' : 'Нова колекція 2026',
      subtitle: locale === 'ru' ? 'Откройте для себя уникальные модели' : 'Відкрийте для себе унікальні моделі',
    },
    {
      image: '/home/hero/slide-3.jpg',
      title: locale === 'ru' ? 'Стиль и качество' : 'Стиль та якість',
      subtitle: locale === 'ru' ? 'Сумки для особых моментов' : 'Сумки для особливих моментів',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <HeroSlider locale={locale} slides={heroSlides} />

      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 className="text-4xl md:text-5xl font-bold text-center mb-16" variants={fadeInUp}>
              {t(locale, 'home.categories_title')}
            </motion.h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.div key={category.slug} variants={fadeInUp}>
                    <Link href={`/${locale}/catalog/${category.slug}`} className="group block">
                      <div className="relative aspect-square bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-black hover:shadow-xl">
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center gap-3">
                          <div className="transition-transform group-hover:scale-110 duration-300">
                            <Icon className="h-10 w-10 md:h-12 md:w-12 text-black" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-xs md:text-sm font-semibold text-black leading-tight">
                            {locale === 'ru' ? category.name_ru : category.name_uk}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <HomeHitsSection locale={locale} maxItems={4} />

      <section className="py-20 md:py-28 bg-black text-white">
        <div className="container">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 className="text-4xl md:text-5xl font-bold text-center mb-16" variants={fadeInUp}>
              {t(locale, 'home.benefits_title')}
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <Award className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_1_title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t(locale, 'home.benefit_1_desc')}</p>
              </motion.div>

              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <Truck className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_2_title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t(locale, 'home.benefit_2_desc')}</p>
              </motion.div>

              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <Shield className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_3_title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t(locale, 'home.benefit_3_desc')}</p>
              </motion.div>

              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <HeadphonesIcon className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_4_title')}</h3>
                <p className="text-gray-400 leading-relaxed">{t(locale, 'home.benefit_4_desc')}</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <AboutUsSection locale={locale} />
      <TestimonialSlider locale={locale} />
      <HomeFaqSection locale={locale} />

      <section className="py-20 md:py-28 bg-white">
        <div className="container">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={fadeInUp}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8 md:p-16 lg:p-20 border-2 border-gray-800">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
              <div className="relative z-10 max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  {t(locale, 'home.wholesale_title')}
                </h2>
                <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                  {t(locale, 'home.wholesale_desc')}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 h-auto rounded-full font-semibold"
                >
                  <Link href={`/${locale}/wholesale`}>
                    {t(locale, 'home.learn_more')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
