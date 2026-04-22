/**
 * Canonical site URL used for sitemap, robots, canonical tags, and hreflang.
 *
 * Resolution order:
 *   1. SITE_URL                       — server-only explicit override (set in Vercel dashboard)
 *   2. NEXT_PUBLIC_SITE_URL           — if set to a real production domain (not the placeholder)
 *   3. VERCEL_PROJECT_PRODUCTION_URL  — auto-provided by Vercel when a custom domain is configured
 *   4. VERCEL_URL                     — the Vercel deployment URL (preview or production)
 *
 * Set SITE_URL=https://your-domain.com in Vercel → Environment Variables (Production).
 */
export function getSiteUrl(): string {
  const serverUrl = process.env.SITE_URL
  if (serverUrl) return serverUrl.replace(/\/$/, '')

  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  // Only use if it's a real production domain, not the default placeholder
  if (publicUrl && publicUrl !== 'https://jl-bags.vercel.app') return publicUrl.replace(/\/$/, '')

  // Vercel auto-sets this to the production custom domain (no manual configuration needed)
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProd) return `https://${vercelProd.replace(/\/$/, '')}`

  // Vercel deployment URL (includes protocol-less host like xxx.vercel.app)
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, '')}`

  return 'https://jl-bags.vercel.app'
}

// Module-level constant for client-side use (metadata, canonical tags).
// For server-only paths (sitemap, robots) call getSiteUrl() directly so
// the env var is read at request time rather than being frozen at build time.
export const SITE_URL = getSiteUrl()
