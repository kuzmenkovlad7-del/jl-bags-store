/**
 * Canonical site URL used for sitemap, robots, canonical tags, and hreflang.
 * Set NEXT_PUBLIC_SITE_URL in your environment to your production domain.
 * Example: https://julia-lebedeva.com
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (url) return url.replace(/\/$/, '')
  return 'https://jl-bags.vercel.app'
}

export const SITE_URL = getSiteUrl()
