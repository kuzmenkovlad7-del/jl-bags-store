'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Truck, Award, HeadphonesIcon, Backpack, Wallet, ShoppingBag, Package } from 'lucide-react'
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
import { Product, Category } from '@/lib/types'
import { Locale, t } from '@/lib/i18n'
import { formatPrice } from '@/lib/utils'

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  ryukzak_ekoshkira: Backpack,
  ryukzak_tekstil: Backpack,
  shkilnyi_ryukzak: Backpack,
  klatch_krosbodi: ShoppingBag,
  sumka_ekoshkira: ShoppingBag,
  sumka_stobana: ShoppingBag,
  bananka: Package,
  sumka_tekstil: ShoppingBag,
  cholovicha_sumka: ShoppingBag,
  gamanets_zhinochyi: Wallet,
  gamanets_cholovichyi: Wallet,
  sumka_sport: Package,
}

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
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Load categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')
          .limit(6)

        // Load featured products (new and hit items)
        const { data: productsData } = await supabase
          .from('products')
          .select('*, media:product_media(*)')
          .eq('is_active', true)
          .or('is_new.eq.true,is_hit.eq.true')
          .order('created_at', { ascending: false })
          .limit(6)

        setCategories(categoriesData || [])
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
      {/* Hero Section */}
      <section className="relative bg-black text-white py-24 md:py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90" />
        <div className="container relative z-10">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-tight"
              variants={fadeInUp}
            >
              {t(locale, 'home.hero_title')}
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              {t(locale, 'home.hero_subtitle')}
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 h-auto"
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

      {/* Categories Section */}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {categories.map((category) => {
                const Icon = categoryIcons[category.slug] || ShoppingBag
                return (
                  <motion.div key={category.id} variants={fadeInUp}>
                    <Link
                      href={`/${locale}/catalog?category=${category.slug}`}
                      className="group block"
                    >
                      <div className="relative aspect-square bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-black hover:shadow-xl">
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                          <div className="mb-3 transition-transform group-hover:scale-110 duration-300">
                            <Icon className="h-10 w-10 md:h-12 md:w-12 text-black" strokeWidth={1.5} />
                          </div>
                          <h3 className="text-sm md:text-base font-semibold text-black leading-tight">
                            {locale === 'ru' && category.name_ru ? category.name_ru : category.name_uk}
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

      {/* Featured Products Section */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <Link
                    href={`/${locale}/product/${product.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 mb-6 border-2 border-transparent group-hover:border-black transition-all duration-300">
                      {product.media && product.media[0] ? (
                        <Image
                          src={product.media[0].url}
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
              ))}
            </div>
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
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6">
                  <Award className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_1_title')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t(locale, 'home.benefit_1_desc')}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6">
                  <Truck className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_2_title')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t(locale, 'home.benefit_2_desc')}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6">
                  <Shield className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t(locale, 'home.benefit_3_title')}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {t(locale, 'home.benefit_3_desc')}
                </p>
              </motion.div>
              <motion.div className="text-center" variants={fadeInUp}>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 border-2 border-white/20 mb-6">
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
                  className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6 h-auto"
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
