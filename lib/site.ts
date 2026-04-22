/**
 * Canonical site URL used for sitemap, robots, canonical tags, and hreflang.
 *
 * Resolution order (server-side):
 *   1. SITE_URL                       — explicit server-only override; set this in Vercel dashboard
 *                                       (Production environment) to your real domain.
 *   2. VERCEL_PROJECT_PRODUCTION_URL  — Vercel sets this automatically to the oldest custom
 *                                       production domain, or to the project's .vercel.app domain.
 *                                       No manual configuration needed when a custom domain is set.
 *   3. NEXT_PUBLIC_SITE_URL           — fallback; may be stale if copied from the example value.
 *   4. VERCEL_URL                     — current deployment URL (last resort, changes per deploy).
 */
export function getSiteUrl(): string {
  // 1. Explicit server-only override
  const serverUrl = process.env.SITE_URL
  if (serverUrl) return serverUrl.replace(/\/$/, '')

  // 2. Vercel auto-provided production domain (includes custom domains)
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProd) return `https://${vercelProd.replace(/\/$/, '')}`

  // 3. Explicit public env var (lower priority — may be the placeholder value)
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (publicUrl) return publicUrl.replace(/\/$/, '')

  // 4. Deployment-specific URL
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, '')}`

  return 'https://jl-bags.vercel.app'
}

// Module-level constant for client-side use (metadata, canonical tags).
// For server-only paths (sitemap, robots) call getSiteUrl() directly so
// the env var is read at request time rather than being frozen at build time.
export const SITE_URL = getSiteUrl()
