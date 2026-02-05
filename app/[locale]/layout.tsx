import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Toaster } from '@/components/ui/toaster'
import { getLocale, locales, Locale } from '@/lib/i18n'
import { supabase } from '@/lib/supabase/client'
import { Settings } from '@/lib/types'

async function getSettings(): Promise<Settings> {
  const { data } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  return data || {
    brand_name: 'JL',
    phone: '0957427720',
    instagram_url: 'https://www.instagram.com/sumki_kharkov',
    facebook_url: 'https://www.facebook.com/sumki.kharkov.julia/?ref=PROFILE_EDIT_xav_ig_profile_page_web#',
    telegram_url: 't.me/joinchat/VGzA____Ogov8wZ_',
    default_locale: 'uk',
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
      <Header locale={locale} settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} settings={settings} />
      <Toaster />
    </div>
  )
}
