import RouteScrollReset from '@/components/system/route-scroll-reset'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { GA_ID, META_PIXEL_ID } from '@/lib/analytics'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Julia Lebedeva — Преміальні жіночі сумки в Україні',
  description:
    'Преміальні жіночі сумки та аксесуари від Julia Lebedeva. Актуальні колекції, швидка доставка по Україні, опт для партнерів.',
  keywords: 'жіночі сумки, сумки Україна, Julia Lebedeva, преміальні сумки, опт сумки, дропшипінг',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Julia Lebedeva — Преміальні жіночі сумки',
    description: 'Преміальні жіночі сумки та аксесуари. Актуальні колекції, швидка доставка.',
    type: 'website',
    locale: 'uk_UA',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={inter.className}>
        <RouteScrollReset />
        {children}

        {/* ─── GA4 ─────────────────────────────────────────────────────────────
            Requires: NEXT_PUBLIC_GA_ID env var (e.g. G-XXXXXXXXXX)
            Skipped automatically when env var is not set.
        ──────────────────────────────────────────────────────────────────────── */}
        {GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script strategy="afterInteractive" id="ga4-init">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { send_page_view: true });
              `}
            </Script>
          </>
        )}

        {/* ─── Meta Pixel ───────────────────────────────────────────────────────
            Requires: NEXT_PUBLIC_META_PIXEL_ID env var (numeric Pixel ID)
            Skipped automatically when env var is not set.
        ──────────────────────────────────────────────────────────────────────── */}
        {META_PIXEL_ID && (
          <Script strategy="afterInteractive" id="meta-pixel">
            {`
              !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </body>
    </html>
  )
}
