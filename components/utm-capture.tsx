'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Reads UTM parameters from the current URL and stores them in sessionStorage
 * so they survive navigation within the session and can be attached to order submissions.
 *
 * Must be wrapped in <Suspense> by the parent (useSearchParams requirement).
 */
export function UtmCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    try {
      const utmSource = searchParams.get('utm_source')
      const utmMedium = searchParams.get('utm_medium')
      const utmCampaign = searchParams.get('utm_campaign')

      // Only overwrite if new UTM params are present (preserves first-touch)
      if (utmSource) {
        sessionStorage.setItem('jl_utm_source', utmSource)
        sessionStorage.setItem('jl_utm_medium', utmMedium ?? '')
        sessionStorage.setItem('jl_utm_campaign', utmCampaign ?? '')
      }

      // Capture referrer once per session (first-touch)
      if (document.referrer && !sessionStorage.getItem('jl_referrer')) {
        sessionStorage.setItem('jl_referrer', document.referrer)
      }
    } catch {
      // sessionStorage may be blocked (e.g. strict privacy mode) — fail silently
    }
  }, [searchParams])

  return null
}
