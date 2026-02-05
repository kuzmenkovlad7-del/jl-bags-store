import { Locale, t } from '@/lib/i18n'

export default function TermsPage({
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
          {t(locale, 'terms.title')}
        </h1>
        <p className="text-sm text-gray-500">
          {t(locale, 'terms.last_updated')}
        </p>
      </div>

      {/* Introduction */}
      <div className="mb-10">
        <p className="text-lg text-gray-700 leading-relaxed">
          {t(locale, 'terms.intro')}
        </p>
      </div>

      {/* Section 1: General Provisions */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.section1_title')}
        </h2>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section1_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section1_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section1_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section1_item4')}
          </li>
        </ul>
      </section>

      {/* Section 2: Ordering */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.section2_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'terms.section2_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section2_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section2_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section2_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section2_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section2_item5')}
          </li>
        </ul>
      </section>

      {/* Section 3: Pricing and Payment */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.section3_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'terms.section3_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section3_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section3_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section3_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section3_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section3_item5')}
          </li>
        </ul>
      </section>

      {/* Section 4: Delivery */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.section4_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'terms.section4_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section4_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section4_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section4_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section4_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section4_item5')}
          </li>
        </ul>
      </section>

      {/* Section 5: Returns and Exchanges */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.section5_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'terms.section5_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section5_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section5_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section5_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section5_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section5_item5')}
          </li>
        </ul>
      </section>

      {/* Section 6: Warranties */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.section6_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'terms.section6_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section6_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section6_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section6_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section6_item4')}
          </li>
        </ul>
      </section>

      {/* Section 7: Liability */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.section7_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'terms.section7_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section7_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section7_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section7_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'terms.section7_item4')}
          </li>
        </ul>
      </section>

      {/* Contact Section */}
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'terms.contact_title')}
        </h2>
        <p className="text-gray-700 mb-4">
          {t(locale, 'terms.contact_desc')}
        </p>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-semibold">{t(locale, 'terms.contact_phone')}:</span>{' '}
            <a href="tel:+380957427720" className="hover:underline">
              +380 95 742 7720
            </a>
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">{t(locale, 'terms.contact_instagram')}:</span>{' '}
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
            <span className="font-semibold">{t(locale, 'terms.contact_address')}:</span>{' '}
            {t(locale, 'terms.contact_address_value')}
          </p>
        </div>
      </section>
    </div>
  )
}
