import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import RouteScrollReset from '@/components/system/route-scroll-reset'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'
import { UtmCapture } from '@/components/utm-capture'
import { getLocale, locales, Locale } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import { SITE_URL } from '@/lib/site'
import { Settings } from '@/lib/types'

async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).single()

  return (
    data || {
      brand_name: 'JL',
      phone: '0957427720',
      instagram_url: 'https://www.instagram.com/sumki_kharkov',
      facebook_url:
        'https://www.facebook.com/sumki.kharkov.julia/?ref=PROFILE_EDIT_xav_ig_profile_page_web#',
      telegram_url: 't.me/joinchat/VGzA____Ogov8wZ_',
      default_locale: 'uk',
    }
  )
}

/**
 * Locale-level metadata: hreflang alternates for uk/ru.
 * Per-page overrides (product pages, catalog, etc.) can refine these.
 */
export async function generateMetadata({
  params,
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return {
    alternates: {
      languages: {
        uk: `${SITE_URL}/uk`,
        ru: `${SITE_URL}/ru`,
        'x-default': `${SITE_URL}/uk`,
      },
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const locale = getLocale(params.locale)

  if (!locales.includes(locale)) {
    notFound()
  }

  const settings = await getSettings()

  return (
    <div className="flex min-h-screen flex-col">
      {/*
        Set the correct html lang attribute for this locale.
        The root layout defaults to "uk"; this inline script corrects it
        synchronously before the browser parses any further HTML.
      */}
      {locale !== 'uk' && (
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.lang='${locale}'` }}
        />
      )}

      <Header locale={locale} settings={settings} />

      <main className="flex-1">
        <RouteScrollReset />
        {/* UTM capture must be in Suspense because it uses useSearchParams */}
        <Suspense fallback={null}>
          <UtmCapture />
        </Suspense>
        {children}
      </main>

      <Footer locale={locale} settings={settings} />
      <Toaster />
    </div>
  )
}
