import { Locale, t } from '@/lib/i18n'
import { Phone, MessageCircle, Send, Package, Truck, Clock, AlertCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function WholesalePage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale as Locale

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black text-white py-20">
        <div className="container max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            {t(locale, 'wholesale.hero_title')}
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
            {t(locale, 'wholesale.hero_subtitle')}
          </p>
        </div>
      </section>

      <div className="container max-w-5xl py-16 space-y-16">
        {/* Dropshipping Section */}
        <section>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Package className="h-8 w-8" />
              <h2 className="text-3xl font-bold">{t(locale, 'wholesale.dropshipping_title')}</h2>
            </div>
            <p className="text-lg text-gray-600">{t(locale, 'wholesale.dropshipping_subtitle')}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-700" />
                <p className="text-gray-900">{t(locale, 'wholesale.drop_shipping_1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-700" />
                <p className="text-gray-900">{t(locale, 'wholesale.drop_shipping_2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-700" />
                <p className="text-gray-900">{t(locale, 'wholesale.drop_shipping_3')}</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-700" />
                <p className="text-gray-900">{t(locale, 'wholesale.drop_shipping_4')}</p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-700" />
                <p className="text-gray-900">{t(locale, 'wholesale.drop_shipping_5')}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Badge variant="destructive" className="mb-4 text-sm py-1.5 px-3">
                <AlertCircle className="h-4 w-4 mr-1" />
                {t(locale, 'wholesale.drop_storage_warning')}
              </Badge>
              <div className="space-y-2 ml-6">
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-sm">•</span>
                  <p className="text-sm text-gray-600">{t(locale, 'wholesale.drop_storage_info_1')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-sm">•</span>
                  <p className="text-sm text-gray-600">{t(locale, 'wholesale.drop_storage_info_2')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wholesale Section */}
        <section>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Package className="h-8 w-8" />
              <h2 className="text-3xl font-bold">{t(locale, 'wholesale.wholesale_title')}</h2>
            </div>
            <p className="text-lg text-gray-600">{t(locale, 'wholesale.wholesale_subtitle')}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <p className="text-gray-900 pt-1">{t(locale, 'wholesale.wholesale_condition_1')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <p className="text-gray-900 pt-1">{t(locale, 'wholesale.wholesale_condition_2')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <p className="text-gray-900 pt-1">{t(locale, 'wholesale.wholesale_condition_3')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <p className="text-gray-900 pt-1">{t(locale, 'wholesale.wholesale_condition_4')}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">✓</span>
                <p className="text-gray-900 pt-1">{t(locale, 'wholesale.wholesale_condition_5')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Manager Contact Section */}
        <section className="bg-black text-white rounded-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t(locale, 'wholesale.manager_title')}
            </h2>
            <p className="text-gray-300 text-lg">
              {t(locale, 'wholesale.manager_subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="tel:+380985218707"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors w-full sm:w-auto justify-center"
            >
              <Phone className="h-5 w-5" />
              {t(locale, 'wholesale.contact_phone')}
            </a>
            <a
              href="viber://chat?number=%2B380985218707"
              className="inline-flex items-center gap-2 bg-[#7360f2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#665ac8] transition-colors w-full sm:w-auto justify-center"
            >
              <MessageCircle className="h-5 w-5" />
              {t(locale, 'wholesale.contact_viber')}
            </a>
            <a
              href="https://t.me/380985218707"
              className="inline-flex items-center gap-2 bg-[#0088cc] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0077b3] transition-colors w-full sm:w-auto justify-center"
            >
              <Send className="h-5 w-5" />
              {t(locale, 'wholesale.contact_telegram')}
            </a>
          </div>

          <div className="text-center mt-6">
            <p className="text-2xl font-bold text-white">+380 98 521 87 07</p>
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold mb-8">{t(locale, 'wholesale.faq_title')}</h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                {t(locale, 'wholesale.faq_q1')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {t(locale, 'wholesale.faq_a1')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                {t(locale, 'wholesale.faq_q2')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {t(locale, 'wholesale.faq_a2')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                {t(locale, 'wholesale.faq_q3')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {t(locale, 'wholesale.faq_a3')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                {t(locale, 'wholesale.faq_q4')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {t(locale, 'wholesale.faq_a4')}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                {t(locale, 'wholesale.faq_q5')}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {t(locale, 'wholesale.faq_a5')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  )
}
