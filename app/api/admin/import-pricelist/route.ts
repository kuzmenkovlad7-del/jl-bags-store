import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase, runImportFromVariants, ParsedVariant } from '@/lib/pricelist-import'

export const runtime = 'nodejs'
export const maxDuration = 60

// Re-export ImportReport so existing client import still resolves
export type { ImportReport } from '@/lib/pricelist-import'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const variants: ParsedVariant[] = body.variants ?? []

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ ok: false, error: 'variants array is required' }, { status: 400 })
    }

    const supabase = getServiceSupabase()
    const report   = await runImportFromVariants(variants, supabase)

    return NextResponse.json({ ok: true, report })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unexpected error' },
      { status: 500 }
    )
  }
}
