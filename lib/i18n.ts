export type Locale = 'uk' | 'ru'

export const defaultLocale: Locale = 'uk'
export const locales: Locale[] = ['uk', 'ru']

export function getLocale(locale?: string): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale
  }
  return defaultLocale
}

export const translations = {
  uk: {
    nav: {
      catalog: 'Каталог',
      delivery: 'Доставка та оплата',
      wholesale: 'Оптовикам',
      contacts: 'Контакти',
    },
    home: {
      hero_title: 'Жіночі сумки',
      hero_subtitle: 'Преміальна якість від JL',
      shop_now: 'До каталогу',
      featured_products: 'Популярні моделі',
      benefits_title: 'Чому обирають нас',
      benefit_1_title: 'Якість',
      benefit_1_desc: 'Натуральні матеріали преміум-класу',
      benefit_2_title: 'Швидка доставка',
      benefit_2_desc: 'Відправка протягом 1-2 днів',
      benefit_3_title: 'Гарантія',
      benefit_3_desc: 'Обмін та повернення протягом 14 днів',
    },
    catalog: {
      title: 'Каталог',
      search_placeholder: 'Пошук за кодом моделі...',
      filter_stock: 'Наявність',
      filter_color: 'Колір',
      sort_by: 'Сортувати',
      sort_newest: 'Нові',
      sort_code: 'За кодом',
      sort_price_asc: 'Ціна: за зростанням',
      sort_price_desc: 'Ціна: за спаданням',
      all_stock: 'Всі',
      in_stock: 'В наявності',
      low_stock: 'Закінчується',
      preorder: 'Під замовлення',
      out_of_stock: 'Немає в наявності',
    },
    product: {
      code: 'Артикул',
      material: 'Матеріал',
      size: 'Розмір',
      colors: 'Кольори',
      retail_price: 'Роздрібна ціна',
      drop_price: 'Ціна дроп',
      order_retail: 'Замовити роздріб',
      order_drop: 'Замовити дроп',
      request_wholesale: 'Запит на опт',
      similar: 'Схожі товари',
    },
    order: {
      title: 'Оформлення замовлення',
      name: "Ім'я",
      phone: 'Телефон',
      telegram: 'Telegram (необов\'язково)',
      city: 'Місто (необов\'язково)',
      delivery: 'Спосіб доставки',
      delivery_nova: 'Нова Пошта',
      delivery_ukr: 'Укрпошта',
      delivery_courier: "Кур'єр",
      comment: 'Коментар (необов\'язково)',
      submit: 'Відправити замовлення',
      success_title: 'Замовлення прийнято!',
      success_desc: 'Ми зв\'яжемося з вами найближчим часом',
    },
    footer: {
      about: 'Про нас',
      info: 'Інформація',
      contacts: 'Контакти',
      privacy: 'Політика конфіденційності',
      terms: 'Умови використання',
    },
  },
  ru: {
    nav: {
      catalog: 'Каталог',
      delivery: 'Доставка и оплата',
      wholesale: 'Оптовикам',
      contacts: 'Контакты',
    },
    home: {
      hero_title: 'Женские сумки',
      hero_subtitle: 'Премиальное качество от JL',
      shop_now: 'В каталог',
      featured_products: 'Популярные модели',
      benefits_title: 'Почему выбирают нас',
      benefit_1_title: 'Качество',
      benefit_1_desc: 'Натуральные материалы премиум-класса',
      benefit_2_title: 'Быстрая доставка',
      benefit_2_desc: 'Отправка в течение 1-2 дней',
      benefit_3_title: 'Гарантия',
      benefit_3_desc: 'Обмен и возврат в течение 14 дней',
    },
    catalog: {
      title: 'Каталог',
      search_placeholder: 'Поиск по коду модели...',
      filter_stock: 'Наличие',
      filter_color: 'Цвет',
      sort_by: 'Сортировать',
      sort_newest: 'Новые',
      sort_code: 'По коду',
      sort_price_asc: 'Цена: по возрастанию',
      sort_price_desc: 'Цена: по убыванию',
      all_stock: 'Все',
      in_stock: 'В наличии',
      low_stock: 'Заканчивается',
      preorder: 'Под заказ',
      out_of_stock: 'Нет в наличии',
    },
    product: {
      code: 'Артикул',
      material: 'Материал',
      size: 'Размер',
      colors: 'Цвета',
      retail_price: 'Розничная цена',
      drop_price: 'Цена дроп',
      order_retail: 'Заказать розницу',
      order_drop: 'Заказать дроп',
      request_wholesale: 'Запрос на опт',
      similar: 'Похожие товары',
    },
    order: {
      title: 'Оформление заказа',
      name: 'Имя',
      phone: 'Телефон',
      telegram: 'Telegram (необязательно)',
      city: 'Город (необязательно)',
      delivery: 'Способ доставки',
      delivery_nova: 'Новая Почта',
      delivery_ukr: 'Укрпочта',
      delivery_courier: 'Курьер',
      comment: 'Комментарий (необязательно)',
      submit: 'Отправить заказ',
      success_title: 'Заказ принят!',
      success_desc: 'Мы свяжемся с вами в ближайшее время',
    },
    footer: {
      about: 'О нас',
      info: 'Информация',
      contacts: 'Контакты',
      privacy: 'Политика конфиденциальности',
      terms: 'Условия использования',
    },
  },
}

export function t(locale: Locale, key: string): string {
  const keys = key.split('.')
  let value: any = translations[locale]

  for (const k of keys) {
    value = value?.[k]
  }

  return value || key
}
