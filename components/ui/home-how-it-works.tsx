'use client'

import { Locale } from '@/lib/i18n'

type Props = { locale: Locale }

const STEPS = {
  uk: [
    {
      num: '1',
      title: 'Оберіть товар',
      desc: 'Перегляньте каталог та знайдіть модель, яка вам підходить. Фільтруйте за категорією або ціною.',
    },
    {
      num: '2',
      title: 'Оформіть замовлення',
      desc: "Натисніть «Замовити», залиште ім'я і телефон. Ми зв'яжемося протягом кількох годин.",
    },
    {
      num: '3',
      title: 'Отримайте на Нову Пошту',
      desc: 'Відправка 1–2 робочих дні по всій Україні. Оплата при отриманні.',
    },
  ],
  ru: [
    {
      num: '1',
      title: 'Выберите товар',
      desc: 'Просмотрите каталог и найдите модель, которая вам нравится. Фильтруйте по категории или цене.',
    },
    {
      num: '2',
      title: 'Оформите заказ',
      desc: 'Нажмите «Заказать», оставьте имя и телефон. Мы свяжемся в течение нескольких часов.',
    },
    {
      num: '3',
      title: 'Получите на Нову Пошту',
      desc: 'Отправка 1–2 рабочих дня по всей Украине. Оплата при получении.',
    },
  ],
}

export function HomeHowItWorks({ locale }: Props) {
  const steps = STEPS[locale === 'ru' ? 'ru' : 'uk']

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div className="container">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
          {locale === 'ru' ? 'Как оформить заказ' : 'Як оформити замовлення'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
          {steps.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white mb-6 shrink-0">
                <span className="text-2xl font-bold">{step.num}</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
