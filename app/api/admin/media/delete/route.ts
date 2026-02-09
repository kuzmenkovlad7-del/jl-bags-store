import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const BUCKET = 'product-media'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (service) return createClient(url, service)
  if (anon) return createClient(url, anon)

  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

function extractPath(input: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  if (input.includes(marker)) return decodeURIComponent(input.split(marker)[1] || '')
  return input
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await req.json().catch(() => ({}))

    const candidate =
      String(body?.storagePath || body?.path || body?.url || '').trim()

    if (!candidate) {
      return NextResponse.json({ ok: false, error: 'storagePath/path/url is required' }, { status: 400 })
    }

    const storagePath = extractPath(candidate)

    const { error } = await supabase.storage.from(BUCKET).remove([storagePath])

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, storagePath })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'delete failed' },
      { status: 500 }
    )
  }
}
