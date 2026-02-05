import { Locale, t } from '@/lib/i18n'

export default function DeliveryPaymentPage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale as Locale

  return (
    <div className="container py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-4xl font-bold mb-3">
          {t(locale, 'delivery.title')}
        </h1>
        <p className="text-sm text-gray-500">
          {t(locale, 'delivery.last_updated')}
        </p>
      </div>

      {/* Introduction */}
      <div className="mb-10">
        <p className="text-lg text-gray-700 leading-relaxed">
          {t(locale, 'delivery.intro')}
        </p>
      </div>

      {/* Section 1: Delivery Methods */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'delivery.section1_title')}
        </h2>
        <p className="text-gray-700 mb-4">
          {t(locale, 'delivery.section1_intro')}
        </p>

        {/* Nova Poshta */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">
            {t(locale, 'delivery.section1_method1_title')}
          </h3>
          <ul className="space-y-2 ml-6">
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method1_item1')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method1_item2')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method1_item3')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method1_item4')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method1_item5')}
            </li>
          </ul>
        </div>

        {/* Ukrposhta */}
        <div>
          <h3 className="text-xl font-semibold mb-3">
            {t(locale, 'delivery.section1_method2_title')}
          </h3>
          <ul className="space-y-2 ml-6">
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method2_item1')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method2_item2')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method2_item3')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method2_item4')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section1_method2_item5')}
            </li>
          </ul>
        </div>
      </section>

      {/* Section 2: Processing Times */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'delivery.section2_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'delivery.section2_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section2_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section2_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section2_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section2_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section2_item5')}
          </li>
        </ul>
      </section>

      {/* Section 3: Package Storage */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'delivery.section3_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'delivery.section3_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section3_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section3_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section3_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section3_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section3_item5')}
          </li>
        </ul>
      </section>

      {/* Section 4: Payment Methods */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'delivery.section4_title')}
        </h2>
        <p className="text-gray-700 mb-4">
          {t(locale, 'delivery.section4_intro')}
        </p>

        {/* Cash on Delivery */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">
            {t(locale, 'delivery.section4_method1_title')}
          </h3>
          <ul className="space-y-2 ml-6">
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method1_item1')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method1_item2')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method1_item3')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method1_item4')}
            </li>
          </ul>
        </div>

        {/* Card Payment */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">
            {t(locale, 'delivery.section4_method2_title')}
          </h3>
          <ul className="space-y-2 ml-6">
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method2_item1')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method2_item2')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method2_item3')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method2_item4')}
            </li>
          </ul>
        </div>

        {/* Wholesale Clients */}
        <div>
          <h3 className="text-xl font-semibold mb-3">
            {t(locale, 'delivery.section4_method3_title')}
          </h3>
          <ul className="space-y-2 ml-6">
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method3_item1')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method3_item2')}
            </li>
            <li className="text-gray-700 list-disc">
              {t(locale, 'delivery.section4_method3_item3')}
            </li>
          </ul>
        </div>
      </section>

      {/* Section 5: Delivery Cost */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'delivery.section5_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'delivery.section5_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section5_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section5_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section5_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section5_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'delivery.section5_item5')}
          </li>
        </ul>
      </section>

      {/* Section 6: International Delivery */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'delivery.section6_title')}
        </h2>
        <p className="text-gray-700">
          {t(locale, 'delivery.section6_desc')}
        </p>
      </section>

      {/* Contact Section */}
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'delivery.contact_title')}
        </h2>
        <p className="text-gray-700 mb-4">
          {t(locale, 'delivery.contact_desc')}
        </p>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-semibold">{t(locale, 'delivery.contact_phone')}:</span>{' '}
            <a href="tel:+380957427720" className="hover:underline">
              +380 95 742 7720
            </a>
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">{t(locale, 'delivery.contact_instagram')}:</span>{' '}
            <a
              href="https://www.instagram.com/sumki_kharkov"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              @sumki_kharkov
            </a>
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">{t(locale, 'delivery.contact_address')}:</span>{' '}
            {t(locale, 'delivery.contact_address_value')}
          </p>
        </div>
      </section>
    </div>
  )
}
