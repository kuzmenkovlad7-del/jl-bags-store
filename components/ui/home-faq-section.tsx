import UniqueAccordion, { UniqueAccordionItem } from '@/components/ui/unique-accordion';

type Locale = 'uk' | 'ru';

type HomeFaqSectionProps = {
  locale: Locale;
};

export function HomeFaqSection({ locale }: HomeFaqSectionProps) {
  const isRu = locale === 'ru';

  const items: UniqueAccordionItem[] = isRu
    ? [
        {
          id: 'dispatch',
          title: 'Как быстро отправляются заказы?',
          content: 'Обычно отправляем в день заказа или на следующий рабочий день после подтверждения.',
        },
        {
          id: 'delivery',
          title: 'Какие способы доставки доступны?',
          content: 'Новая Почта по Украине. Отправляем в отделение, почтомат или курьером по адресу.',
        },
        {
          id: 'storage',
          title: 'Сколько хранятся посылки на почте?',
          content: 'Срок хранения зависит от правил перевозчика. Рекомендуем забирать посылку в первые дни после прибытия.',
        },
        {
          id: 'wholesale',
          title: 'Какие условия для оптовых закупок?',
          content: 'Для опта и дропшиппинга действуют специальные условия. Подробности доступны в разделе Оптовикам.',
        },
      ]
    : [
        {
          id: 'dispatch',
          title: 'Як швидко відправляються замовлення?',
          content: 'Зазвичай відправляємо в день замовлення або наступного робочого дня після підтвердження.',
        },
        {
          id: 'delivery',
          title: 'Які способи доставки доступні?',
          content: 'Нова Пошта по Україні. Відправляємо у відділення, поштомат або курʼєром на адресу.',
        },
        {
          id: 'storage',
          title: 'Скільки зберігаються посилки на пошті?',
          content: 'Термін зберігання залежить від правил перевізника. Рекомендуємо забирати посилку в перші дні після прибуття.',
        },
        {
          id: 'wholesale',
          title: 'Які умови для оптових закупівель?',
          content: 'Для опту та дропшипінгу діють спеціальні умови. Деталі доступні в розділі Оптовикам.',
        },
      ];

  return (
    <section className='bg-gray-100 py-16 md:py-24'>
      <div className='mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8'>
        <h2 className='text-center text-4xl font-bold text-black md:text-6xl'>
          {isRu ? 'Частые вопросы' : 'Часті запитання'}
        </h2>
        <p className='mx-auto mt-3 mb-10 max-w-2xl text-center text-lg text-gray-500 md:text-2xl'>
          {isRu
            ? 'Коротко собрали основные ответы перед заказом'
            : 'Коротко зібрали основні відповіді перед замовленням'}
        </p>

        <UniqueAccordion items={items} defaultActiveId='delivery' />
      </div>
    </section>
  );
}
