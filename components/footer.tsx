import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Facebook, Send } from 'lucide-react'
import { Locale, t } from '@/lib/i18n'
import { Settings } from '@/lib/types'

interface FooterProps {
  locale: Locale
  settings: Settings
}

export function Footer({ locale, settings }: FooterProps) {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          <div className="md:col-span-1">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/branding/logo-round.png"
                  alt="Julia Lebedeva"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <span className="font-bold text-xl text-black">Julia Lebedeva</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(locale, 'footer.about_text')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-5">{t(locale, 'footer.info')}</h3>
            <nav className="flex flex-col gap-3">
              <Link
                href={`/${locale}/catalog`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {t(locale, 'nav.catalog')}
              </Link>
              <Link
                href={`/${locale}/delivery-payment`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {t(locale, 'nav.delivery')}
              </Link>
              <Link
                href={`/${locale}/wholesale`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {t(locale, 'nav.wholesale')}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-5">{t(locale, 'footer.legal')}</h3>
            <nav className="flex flex-col gap-3">
              <Link
                href={`/${locale}/privacy`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {t(locale, 'footer.privacy')}
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {t(locale, 'footer.terms')}
              </Link>
              <Link
                href={`/${locale}/contacts`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {t(locale, 'nav.contacts')}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-5">{t(locale, 'footer.contacts')}</h3>
            <div className="flex flex-col gap-4">
              <a
                href={`tel:${settings.phone}`}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                {settings.phone}
              </a>
              <div className="flex gap-3">
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:text-black hover:border-black transition-all"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:text-black hover:border-black transition-all"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href={settings.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:text-black hover:border-black transition-all"
                  aria-label="Telegram"
                >
                  <Send className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} Julia Lebedeva. {t(locale, 'footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
