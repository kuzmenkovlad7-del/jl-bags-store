import Link from 'next/link'
import { Instagram, Facebook, Send } from 'lucide-react'
import { Locale, t } from '@/lib/i18n'
import { Settings } from '@/lib/types'

interface FooterProps {
  locale: Locale
  settings: Settings
}

export function Footer({ locale, settings }: FooterProps) {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">{t(locale, 'footer.about')}</h3>
            <p className="text-sm text-muted-foreground">
              {settings.brand_name}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t(locale, 'footer.info')}</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href={`/${locale}/delivery-payment`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t(locale, 'nav.delivery')}
              </Link>
              <Link
                href={`/${locale}/wholesale`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t(locale, 'nav.wholesale')}
              </Link>
              <Link
                href={`/${locale}/privacy`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t(locale, 'footer.privacy')}
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t(locale, 'footer.terms')}
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t(locale, 'footer.contacts')}</h3>
            <div className="flex flex-col gap-3">
              <a
                href={`tel:${settings.phone}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {settings.phone}
              </a>
              <div className="flex gap-3">
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href={settings.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Send className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings.brand_name}</p>
        </div>
      </div>
    </footer>
  )
}
