import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServiceSupabase, parseCSV, runImportFromVariants } from '@/lib/pricelist-import'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    // Auth: verify the Supabase session token sent by the logged-in admin
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Validate the token against Supabase (service role can verify any JWT)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ ok: false, error: 'Supabase is not configured on the server' }, { status: 500 })
    }
    const authClient = createClient(url, key, { auth: { persistSession: false } })
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) {
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

    // Run import with service role client
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

