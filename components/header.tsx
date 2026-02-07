'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Instagram, Facebook, Phone, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Locale, t } from '@/lib/i18n'
import { Settings } from '@/lib/types'

interface HeaderProps {
  locale: Locale
  settings: Settings
}

export function Header({ locale, settings }: HeaderProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const switchLocale = () => {
    const newLocale = locale === 'uk' ? 'ru' : 'uk'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    window.location.href = newPath
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-black/10 bg-white/62 backdrop-blur-xl supports-[backdrop-filter]:bg-white/52">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <Image
                src="/branding/logo-round.png"
                alt="JL"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                priority
              />
            </Link>

            <nav className="hidden md:flex gap-6">
              <Link href={`/${locale}/catalog`} className="text-sm font-medium text-black transition-colors hover:text-black/65">
                {t(locale, 'nav.catalog')}
              </Link>
              <Link href={`/${locale}/delivery-payment`} className="text-sm font-medium text-black transition-colors hover:text-black/65">
                {t(locale, 'nav.delivery')}
              </Link>
              <Link href={`/${locale}/wholesale`} className="text-sm font-medium text-black transition-colors hover:text-black/65">
                {t(locale, 'nav.wholesale')}
              </Link>
              <Link href={`/${locale}/contacts`} className="text-sm font-medium text-black transition-colors hover:text-black/65">
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
                className="text-black hover:text-black/65 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-black/65 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={`tel:${settings.phone}`}
                className="text-black hover:text-black/65 transition-colors"
                aria-label="Phone"
              >
                <Phone className="h-5 w-5" />
              </a>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={switchLocale}
              className="text-sm font-medium text-black hover:bg-black/5 hover:text-black"
            >
              {locale === 'uk' ? 'RU' : 'UA'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-black hover:bg-black/5"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-black/10">
            <span className="font-semibold text-lg text-black">{settings.brand_name}</span>
            <Button variant="ghost" size="sm" onClick={closeMobileMenu} aria-label="Close menu" className="text-black hover:bg-black/5">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-col p-6 gap-4 flex-1">
            <Link href={`/${locale}/catalog`} onClick={closeMobileMenu} className="text-base font-medium py-3 border-b border-black/10 text-black transition-colors hover:text-black/65">
              {t(locale, 'nav.catalog')}
            </Link>
            <Link href={`/${locale}/delivery-payment`} onClick={closeMobileMenu} className="text-base font-medium py-3 border-b border-black/10 text-black transition-colors hover:text-black/65">
              {t(locale, 'nav.delivery')}
            </Link>
            <Link href={`/${locale}/wholesale`} onClick={closeMobileMenu} className="text-base font-medium py-3 border-b border-black/10 text-black transition-colors hover:text-black/65">
              {t(locale, 'nav.wholesale')}
            </Link>
            <Link href={`/${locale}/contacts`} onClick={closeMobileMenu} className="text-base font-medium py-3 border-b border-black/10 text-black transition-colors hover:text-black/65">
              {t(locale, 'nav.contacts')}
            </Link>

            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-black/10">
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-black hover:text-black/65 transition-colors" aria-label="Instagram">
                <Instagram className="h-6 w-6" />
              </a>
              <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-black hover:text-black/65 transition-colors" aria-label="Facebook">
                <Facebook className="h-6 w-6" />
              </a>
              <a href={`tel:${settings.phone}`} className="text-black hover:text-black/65 transition-colors" aria-label="Phone">
                <Phone className="h-6 w-6" />
              </a>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
