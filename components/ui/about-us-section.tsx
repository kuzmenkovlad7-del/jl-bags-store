"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  Sparkles,
  Factory,
  ShieldCheck,
  Boxes,
  Camera,
  Truck,
  Handshake,
  Clock3,
  Users,
  BadgeCheck,
} from "lucide-react"

interface AboutUsSectionProps {
  locale: string
}

type FeatureItem = {
  icon: LucideIcon
  title: string
  desc: string
}

type StatItem = {
  icon: LucideIcon
  value: string
  label: string
}

const data = {
  uk: {
    badge: "ПРЯМИЙ УКРАЇНСЬКИЙ ВИРОБНИК",
    title: "Про нас",
    subtitle:
      "JL Bags це виробник сумок та рюкзаків. Власне виробництво, контроль якості, стабільна наявність та швидкі відправки по Україні.",
    left: [
      {
        icon: Factory,
        title: "Власне виробництво",
        desc: "Ми самі виробляємо моделі JL Bags, тому контролюємо якість на кожному етапі.",
      },
      {
        icon: ShieldCheck,
        title: "Контроль якості",
        desc: "Працюємо лише з практичними та перевіреними матеріалами, які добре носяться.",
      },
      {
        icon: Boxes,
        title: "Стабільна наявність",
        desc: "Тримаємо складські залишки, щоб партнери не втрачали продажі через відсутність товару.",
      },
    ] as FeatureItem[],
    right: [
      {
        icon: Camera,
        title: "Контент для продажів",
        desc: "Надаємо фото та відео моделей для каталогу, сторіс, реклами та маркетплейсів.",
      },
      {
        icon: Truck,
        title: "Швидкі відправки",
        desc: "Оперативно пакуємо та відправляємо замовлення по Україні щодня.",
      },
      {
        icon: Handshake,
        title: "Опт і дропшипінг",
        desc: "Працюємо з бізнесами різного масштабу від малих сторінок до великих магазинів.",
      },
    ] as FeatureItem[],
    stats: [
      { icon: Boxes, value: "100+", label: "Актуальних моделей" },
      { icon: Clock3, value: "1 день", label: "Відправка замовлень" },
      { icon: Users, value: "B2B", label: "Партнерство для бізнесу" },
      { icon: BadgeCheck, value: "100%", label: "Контроль якості" },
    ] as StatItem[],
    ctaPrimary: "Дивитись каталог",
    ctaSecondary: "Опт і дропшипінг",
  },
  ru: {
    badge: "ПРЯМОЙ УКРАИНСКИЙ ПРОИЗВОДИТЕЛЬ",
    title: "О нас",
    subtitle:
      "JL Bags это производитель сумок и рюкзаков. Собственное производство, контроль качества, стабильное наличие и быстрые отправки по Украине.",
    left: [
      {
        icon: Factory,
        title: "Собственное производство",
        desc: "Мы сами производим модели JL Bags, поэтому контролируем качество на каждом этапе.",
      },
      {
        icon: ShieldCheck,
        title: "Контроль качества",
        desc: "Работаем только с практичными и проверенными материалами, которые хорошо носятся.",
      },
      {
        icon: Boxes,
        title: "Стабильное наличие",
        desc: "Держим складские остатки, чтобы партнёры не теряли продажи из-за отсутствия товара.",
      },
    ] as FeatureItem[],
    right: [
      {
        icon: Camera,
        title: "Контент для продаж",
        desc: "Предоставляем фото и видео моделей для каталога, сторис, рекламы и маркетплейсов.",
      },
      {
        icon: Truck,
        title: "Быстрые отправки",
        desc: "Оперативно пакуем и отправляем заказы по Украине ежедневно.",
      },
      {
        icon: Handshake,
        title: "Опт и дропшиппинг",
        desc: "Работаем с бизнесами разного масштаба от небольших страниц до крупных магазинов.",
      },
    ] as FeatureItem[],
    stats: [
      { icon: Boxes, value: "100+", label: "Актуальных моделей" },
      { icon: Clock3, value: "1 день", label: "Отправка заказов" },
      { icon: Users, value: "B2B", label: "Партнёрство для бизнеса" },
      { icon: BadgeCheck, value: "100%", label: "Контроль качества" },
    ] as StatItem[],
    ctaPrimary: "Смотреть каталог",
    ctaSecondary: "Опт и дропшиппинг",
  },
}

function FeatureCard({ item }: { item: FeatureItem }) {
  const Icon = item.icon

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.35 }}
      className="rounded-[28px] border border-black/10 bg-white/70 p-6 md:p-7"
    >
      <div className="flex items-center gap-3">
        <div className="relative rounded-xl bg-black p-2.5 text-white">
          <Icon className="h-5 w-5" />
          <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-white/80" />
        </div>
        <h3 className="text-[28px] leading-[1.05] font-bold text-black md:text-[32px]">
          {item.title}
        </h3>
      </div>
      <p className="mt-3 text-[22px] leading-[1.22] text-black/70 md:text-[24px]">
        {item.desc}
      </p>
    </motion.article>
  )
}

function StatCard({ item }: { item: StatItem }) {
  const Icon = item.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-black/10 bg-white/72 p-6 text-center"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-black/80">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-5xl font-bold leading-none">{item.value}</div>
      <p className="mt-2 text-2xl text-black/65">{item.label}</p>
      <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-black/30" />
    </motion.div>
  )
}

export function AboutUsSection({ locale }: AboutUsSectionProps) {
  const t = locale === "ru" ? data.ru : data.uk

  return (
    <section
      id="about-section"
      className="w-full bg-[#efefeb] px-4 py-16 text-black md:px-6 md:py-20"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-black/55 md:text-sm">
            <Sparkles className="h-4 w-4" />
            <span>{t.badge}</span>
          </div>

          <h2 className="mt-4 text-6xl font-bold leading-none md:text-7xl">{t.title}</h2>
          <div className="mx-auto mt-4 h-[4px] w-32 rounded-full bg-black/45" />

          <p className="mx-auto mt-8 max-w-4xl text-center text-[clamp(22px,3.1vw,56px)] leading-[1.15] font-normal text-black/65">{t.subtitle}</p>
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px_minmax(0,1fr)] xl:items-start">
          <div className="space-y-5">
            {t.left.map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
            className="relative mx-auto w-full max-w-[360px]"
          >
            <div className="overflow-hidden rounded-[30px] border-2 border-white/90 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
              <img
                src="/slide-1.jpg"
                alt="JL Bags"
                className="h-[620px] w-full scale-[1.08] object-cover object-center"
              />
            </div>

            <Link
              href={locale === "ru" ? "/ru/catalog" : "/uk/catalog"}
              className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-white px-8 py-4 text-[20px] font-semibold text-black shadow-md transition hover:scale-[1.02]"
            >
              {t.ctaPrimary}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

          <div className="space-y-5">
            {t.right.map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {t.stats.map((item) => (
            <StatCard key={item.label} item={item} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={locale === "ru" ? "/ru/catalog" : "/uk/catalog"}
            className="inline-flex items-center gap-3 rounded-2xl bg-black px-8 py-4 text-[20px] font-semibold text-white transition hover:bg-black/90"
          >
            {t.ctaPrimary}
            <ArrowRight className="h-5 w-5" />
          </Link>

          <Link
            href={locale === "ru" ? "/ru/opt" : "/uk/opt"}
            className="inline-flex items-center rounded-2xl border border-black/15 bg-white px-8 py-4 text-[20px] font-semibold text-black transition hover:bg-black/[0.03]"
          >
            {t.ctaSecondary}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default AboutUsSection
