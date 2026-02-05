import { Locale, t } from '@/lib/i18n'

export default function PrivacyPage({
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
          {t(locale, 'privacy.title')}
        </h1>
        <p className="text-sm text-gray-500">
          {t(locale, 'privacy.last_updated')}
        </p>
      </div>

      {/* Introduction */}
      <div className="mb-10">
        <p className="text-lg text-gray-700 leading-relaxed">
          {t(locale, 'privacy.intro')}
        </p>
      </div>

      {/* Section 1: Information Collection */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'privacy.section1_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'privacy.section1_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section1_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section1_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section1_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section1_item4')}
          </li>
        </ul>
      </section>

      {/* Section 2: Information Use */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'privacy.section2_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'privacy.section2_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section2_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section2_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section2_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section2_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section2_item5')}
          </li>
        </ul>
      </section>

      {/* Section 3: Data Protection */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'privacy.section3_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'privacy.section3_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section3_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section3_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section3_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section3_item4')}
          </li>
        </ul>
      </section>

      {/* Section 4: Third Party Sharing */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'privacy.section4_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'privacy.section4_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section4_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section4_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section4_item3')}
          </li>
        </ul>
      </section>

      {/* Section 5: Your Rights */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'privacy.section5_title')}
        </h2>
        <p className="text-gray-700 mb-3">
          {t(locale, 'privacy.section5_desc')}
        </p>
        <ul className="space-y-2 ml-6">
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section5_item1')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section5_item2')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section5_item3')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section5_item4')}
          </li>
          <li className="text-gray-700 list-disc">
            {t(locale, 'privacy.section5_item5')}
          </li>
        </ul>
      </section>

      {/* Section 6: Cookies */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'privacy.section6_title')}
        </h2>
        <p className="text-gray-700">
          {t(locale, 'privacy.section6_desc')}
        </p>
      </section>

      {/* Contact Section */}
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold mb-4">
          {t(locale, 'privacy.contact_title')}
        </h2>
        <p className="text-gray-700 mb-4">
          {t(locale, 'privacy.contact_desc')}
        </p>
        <div className="space-y-2">
          <p className="text-gray-700">
            <span className="font-semibold">{t(locale, 'privacy.contact_phone')}:</span>{' '}
            <a href="tel:+380957427720" className="hover:underline">
              +380 95 742 7720
            </a>
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">{t(locale, 'privacy.contact_instagram')}:</span>{' '}
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
            <span className="font-semibold">{t(locale, 'privacy.contact_address')}:</span>{' '}
            {t(locale, 'privacy.contact_address_value')}
          </p>
        </div>
      </section>
    </div>
  )
}
