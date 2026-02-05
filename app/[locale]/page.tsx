'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Truck, Award, HeadphonesIcon, Backpack, Wallet, ShoppingBag, Package, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Product } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

// Visual categories (no DB enforcement in this quick launch)
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
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale as Locale
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load featured products (new and hit items)
        const { data: productsData } = await supabase
          .from('products')
          .select('*, media:product_media(*)')
          .eq('is_active', true)
          .or('is_new.eq.true,is_hit.eq.true')
          .order('created_at', { ascending: false })
          .limit(6)

        setProducts(productsData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Premium */}
      <section className="relative bg-black text-white min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.03),transparent_50%)]" />

        <div className="container relative z-10 py-20">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="max-w-5xl"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-block mb-6 px-4 py-2 border border-white/20 rounded-full text-sm tracking-widest uppercase"
            >
              Premium Collection 2026
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl lg:text-9xl font-bold mb-8 leading-[0.95] tracking-tight"
            >
              {t(locale, 'home.hero_title')}
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-3xl mb-12 text-gray-300 max-w-2xl leading-relaxed"
            >
              {t(locale, 'home.hero_subtitle')}
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-100 text-lg px-10 py-7 h-auto rounded-full font-semibold"
              >
                <Link href={`/${locale}/catalog`}>
                  {t(locale, 'home.shop_now')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section - Visual Only (No DB enforcement) */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              variants={fadeInUp}
            >
              {t(locale, 'home.categories_title')}
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
              {visualCategories.map((category) => {
                const Icon = category.icon
                return (
                  <motion.div key={category.slug} variants={fadeInUp}>
                    <Link
                      href={`/${locale}/catalog`}
                      className="group block"
                    >
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
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section - New Arrivals & Hits */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="flex items-center justify-between mb-16">
              <motion.h2
                className="text-4xl md:text-5xl font-bold"
                variants={fadeInUp}
              >
                {t(locale, 'home.featured_products')}
              </motion.h2>
              <motion.div variants={fadeInUp}>
                <Button asChild variant="outline" className="hidden md:inline-flex border-2">
                  <Link href={`/${locale}/catalog`}>
                    {t(locale, 'home.view_all')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => {
                  const primaryMedia = product.media?.find((m) => m.is_primary && m.media_type === 'photo')
                  const firstMedia = product.media?.find((m) => m.media_type === 'photo')
                  const displayMedia = primaryMedia || firstMedia

                  return (
                    <motion.div key={product.id} variants={fadeInUp}>
                      <Link
                        href={`/${locale}/product/${product.slug}`}
                        className="group block"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 mb-6 border-2 border-transparent group-hover:border-black transition-all duration-300">
                          {displayMedia ? (
                            <Image
                              src={displayMedia.url}
                              alt={product.name_uk}
                              fill
                              className="object-cover transition-transform group-hover:scale-105 duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <span className="text-6xl font-bold">{product.code}</span>
                            </div>
                          )}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.is_new && (
                              <Badge className="bg-black text-white border-0">
                                {t(locale, 'catalog.flag_new')}
                              </Badge>
                            )}
                            {product.is_hit && (
                              <Badge className="bg-white text-black border-2 border-black">
                                {t(locale, 'catalog.flag_hit')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 group-hover:underline">
                          {locale === 'ru' && product.name_ru ? product.name_ru : product.name_uk}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {t(locale, 'product.code')}: {product.code}
                        </p>
                        <p className="text-xl font-bold">{formatPrice(product.price_retail)}</p>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">{locale === 'ru' ? 'Товары скоро появятся' : 'Товари скоро з\'являться'}</p>
              </div>
            )}

            <motion.div variants={fadeInUp} className="mt-12 text-center md:hidden">
              <Button asChild variant="outline" className="border-2 w-full sm:w-auto">
                <Link href={`/${locale}/catalog`}>
                  {t(locale, 'home.view_all')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-28 bg-black text-white">
        <div className="container">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              variants={fadeInUp}
            >
              {t(locale, 'home.benefits_title')}
            </motion.h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <Award className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_1_title')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t(locale, 'home.benefit_1_desc')}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <Truck className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_2_title')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t(locale, 'home.benefit_2_desc')}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <Shield className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_3_title')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t(locale, 'home.benefit_3_desc')}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6 transition-transform hover:scale-110 duration-300">
                  <HeadphonesIcon className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_4_title')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t(locale, 'home.benefit_4_desc')}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="container max-w-4xl">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              variants={fadeInUp}
            >
              {t(locale, 'wholesale.faq_title')}
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="bg-white border-2 border-gray-200 rounded-xl px-6 hover:border-black transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {t(locale, 'wholesale.faq_q1')}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-5">
                    {t(locale, 'wholesale.faq_a1')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="bg-white border-2 border-gray-200 rounded-xl px-6 hover:border-black transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {t(locale, 'wholesale.faq_q2')}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-5">
                    {t(locale, 'wholesale.faq_a2')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="bg-white border-2 border-gray-200 rounded-xl px-6 hover:border-black transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {t(locale, 'wholesale.faq_q3')}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-5">
                    {t(locale, 'wholesale.faq_a3')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="bg-white border-2 border-gray-200 rounded-xl px-6 hover:border-black transition-colors">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {t(locale, 'wholesale.faq_q4')}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-5">
                    {t(locale, 'wholesale.faq_a4')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Wholesale/Dropshipping Teaser */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
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
  )
}
