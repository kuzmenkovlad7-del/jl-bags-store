import { Phone, Instagram, Facebook, Send } from 'lucide-react'
import { Locale } from '@/lib/i18n'
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

export default async function ContactsPage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale as Locale
  const settings = await getSettings()

  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">
        {locale === 'uk' ? 'Контакти' : 'Контакты'}
      </h1>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Phone className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">
              {locale === 'uk' ? 'Телефон' : 'Телефон'}
            </h3>
            <a href={`tel:${settings.phone}`} className="text-primary hover:underline">
              {settings.phone}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Instagram className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Instagram</h3>
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @sumki_kharkov
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Facebook className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Facebook</h3>
            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Julia Lebedeva
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Send className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Telegram</h3>
            <a
              href={settings.telegram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {locale === 'uk' ? 'Написати в Telegram' : 'Написать в Telegram'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
