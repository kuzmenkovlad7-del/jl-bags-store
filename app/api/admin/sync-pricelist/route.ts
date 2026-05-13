import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase, parseCSV, runImportFromVariants } from '@/lib/pricelist-import'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    // Auth: validate Bearer token against SYNC_SECRET
    const syncSecret = process.env.SYNC_SECRET
    if (!syncSecret) {
      return NextResponse.json({ ok: false, error: 'SYNC_SECRET is not configured on the server' }, { status: 500 })
    }
    const authHeader = req.headers.get('authorization') ?? ''
    if (authHeader !== `Bearer ${syncSecret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch CSV from Google Sheets
    const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL
    if (!sheetUrl) {
      return NextResponse.json({ ok: false, error: 'GOOGLE_SHEET_CSV_URL is not configured on the server' }, { status: 500 })
    }

    const fetchRes = await fetch(sheetUrl, { cache: 'no-store' })
    if (!fetchRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Failed to fetch Google Sheet: ${fetchRes.status} ${fetchRes.statusText}` },
        { status: 502 }
      )
    }
    const csvText = await fetchRes.text()

    // Parse CSV
    const { variants, skipped } = parseCSV(csvText)
    if (variants.length === 0) {
      return NextResponse.json({ ok: false, error: `No valid rows found in CSV (${skipped} rows skipped)` }, { status: 422 })
    }

    // Run import
    const supabase = getServiceSupabase()
    const report   = await runImportFromVariants(variants, supabase)

    return NextResponse.json({ ok: true, report, rowsSkipped: skipped })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'unexpected error' },
      { status: 500 }
    )
  }
}
