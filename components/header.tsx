'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Instagram, Facebook, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Locale, t } from '@/lib/i18n'
import { Settings } from '@/lib/types'

interface HeaderProps {
  locale: Locale
  settings: Settings
}

export function Header({ locale, settings }: HeaderProps) {
  const pathname = usePathname()

  const switchLocale = () => {
    const newLocale = locale === 'uk' ? 'ru' : 'uk'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    window.location.href = newPath
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={`/${locale}`} className="flex items-center space-x-2">
            <Image
              src="/brand/logo.png"
              alt="JL"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden md:flex gap-6">
            <Link
              href={`/${locale}/catalog`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t(locale, 'nav.catalog')}
            </Link>
            <Link
              href={`/${locale}/delivery-payment`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t(locale, 'nav.delivery')}
            </Link>
            <Link
              href={`/${locale}/wholesale`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t(locale, 'nav.wholesale')}
            </Link>
            <Link
              href={`/${locale}/contacts`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t(locale, 'nav.contacts')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
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
              href={`tel:${settings.phone}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-5 w-5" />
            </a>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={switchLocale}
            className="text-sm font-medium"
          >
            {locale === 'uk' ? 'RU' : 'UA'}
          </Button>
        </div>
      </div>
    </header>
  )
}
