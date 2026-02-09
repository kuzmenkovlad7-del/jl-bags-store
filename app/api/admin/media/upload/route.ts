import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const BUCKET = 'product-media'
const MAX_SIZE = 100 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm'])

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (service) return createClient(url, service)
  if (anon) return createClient(url, anon)

  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

function sanitizeSegment(input: string) {
  return input.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 })
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: `unsupported file type: ${file.type}` },
        { status: 415 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: `file too large: ${file.size} bytes` },
        { status: 413 }
      )
    }

    const productIdRaw = String(formData.get('productId') || 'common')
    const productId = sanitizeSegment(productIdRaw)
    const ext = (file.name.split('.').pop() || '').toLowerCase() || (file.type === 'video/mp4' ? 'mp4' : 'jpg')
    const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`
    const storagePath = `products/${productId}/${filename}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      })

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message, code: (uploadError as any)?.statusCode ?? null },
        { status: 500 }
      )
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    const publicUrl = data.publicUrl
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'

    return NextResponse.json({
      ok: true,
      bucket: BUCKET,
      storagePath,
      path: storagePath,
      publicUrl,
      url: publicUrl,
      mediaType,
      type: mediaType,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'upload failed' },
      { status: 500 }
    )
  }
}
