/**
 * Canonical site URL used for sitemap, robots, canonical tags, and hreflang.
 *
 * Env var priority (set in Vercel dashboard):
 *   1. SITE_URL              — server-only, not bundled into client JS (preferred for production)
 *   2. NEXT_PUBLIC_SITE_URL  — available on both server and client
 *
 * Example: https://julia-lebedeva.com
 */
export function getSiteUrl(): string {
  const serverUrl = process.env.SITE_URL
  if (serverUrl) return serverUrl.replace(/\/$/, '')
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (publicUrl) return publicUrl.replace(/\/$/, '')
  return 'https://jl-bags.vercel.app'
}

// Module-level constant for client-side use (metadata, canonical tags).
// For server-only paths (sitemap, robots) call getSiteUrl() directly so
// the env var is read at request time rather than being frozen at build time.
export const SITE_URL = getSiteUrl()
