import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const BUCKET = 'product-media'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

function normalizeStoragePath(input: string): string {
  let value = String(input || '').trim()
  if (!value) return ''

  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value)
      const marker = `/storage/v1/object/public/${BUCKET}/`
      const idx = u.pathname.indexOf(marker)
      if (idx >= 0) value = u.pathname.slice(idx + marker.length)
      else value = u.pathname
    } catch {
      // keep original
    }
  }

  value = value.replace(/^\/+/, '')
  value = value.replace(new RegExp(`^${BUCKET}/`), '')
  return decodeURIComponent(value)
}

async function handleDelete(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as any
    const raw = String(body?.storagePath || body?.path || body?.url || '')
    const storagePath = normalizeStoragePath(raw)

    if (!storagePath) {
      return NextResponse.json({ ok: false, error: 'storagePath is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath])

    if (error) {
      return NextResponse.json({ ok: false, error: error.message || 'delete failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, storagePath, path: storagePath })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'delete failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  return handleDelete(req)
}

export async function DELETE(req: NextRequest) {
  return handleDelete(req)
}
