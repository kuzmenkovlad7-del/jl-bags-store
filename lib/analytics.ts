/**
 * Analytics utility — GA4 + Meta Pixel.
 *
 * Required env vars (add to .env.local and Vercel dashboard):
 *   NEXT_PUBLIC_GA_ID        — Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX)
 *   NEXT_PUBLIC_META_PIXEL_ID — Meta Pixel ID (e.g. 1234567890123)
 *
 * If either var is missing/empty the corresponding tracking is silently skipped.
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''

declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    fbq?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

/**
 * Fire a GA4 + Meta Pixel conversion event when an order is submitted.
 * Called client-side only (inside an event handler or useEffect).
 */
export function trackOrderSubmit(params: {
  orderType: string
  productCode: string
  price: number
  color: string
}) {
  if (typeof window === 'undefined') return

  if (GA_ID && window.gtag) {
    window.gtag('event', 'generate_lead', {
      currency: 'UAH',
      value: params.price,
      order_type: params.orderType,
      product_code: params.productCode,
    })
  }

  if (META_PIXEL_ID && window.fbq) {
    window.fbq('track', 'Lead', {
      content_category: params.orderType,
      content_ids: [params.productCode],
      value: params.price,
      currency: 'UAH',
    })
  }
}

/**
 * Read UTM attribution data stored by UtmCapture component.
 * Safe to call on client side only.
 */
export function getStoredAttribution(): {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  referrer_url: string
} {
  if (typeof window === 'undefined') {
    return { utm_source: '', utm_medium: '', utm_campaign: '', referrer_url: '' }
  }
  try {
    return {
      utm_source: sessionStorage.getItem('jl_utm_source') ?? '',
      utm_medium: sessionStorage.getItem('jl_utm_medium') ?? '',
      utm_campaign: sessionStorage.getItem('jl_utm_campaign') ?? '',
      referrer_url: sessionStorage.getItem('jl_referrer') ?? '',
    }
  } catch {
    return { utm_source: '', utm_medium: '', utm_campaign: '', referrer_url: '' }
  }
}
