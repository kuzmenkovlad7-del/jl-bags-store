import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const BUCKET = 'product-media'
const MAX_SIZE = 100 * 1024 * 1024

const ALLOWED = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
])

function extFromName(name: string): string {
  const n = String(name || '').trim()
  const dot = n.lastIndexOf('.')
  if (dot === -1) return ''
  return n.slice(dot + 1).toLowerCase()
}

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'heic':
      return 'image/heic'
    case 'heif':
      return 'image/heif'
    case 'mp4':
      return 'video/mp4'
    case 'mov':
      return 'video/quicktime'
    case 'webm':
      return 'video/webm'
    default:
      return ''
  }
}

function inferKind(mime: string): 'image' | 'video' | 'file' {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'file'
}

function sanitizeSegment(value: string, fallback: string): string {
  const v = String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)
  return v || fallback
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env is not configured')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const picked =
      form.get('file') ??
      form.get('media') ??
      form.get('image') ??
      form.get('video') ??
      form.get('asset')

    if (!picked || typeof picked === 'string') {
      return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 })
    }

    const file = picked as File
    if (file.size <= 0) {
      return NextResponse.json({ ok: false, error: 'empty file' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: 'file is too large (max 100MB)' }, { status: 413 })
    }

    let mime = String(file.type || '').toLowerCase()
    if (mime === 'image/jpg') mime = 'image/jpeg'
    if (!ALLOWED.has(mime)) {
      const byExt = mimeFromExt(extFromName(file.name))
      if (!ALLOWED.has(byExt)) {
        return NextResponse.json({ ok: false, error: 'unsupported mime type' }, { status: 415 })
      }
      mime = byExt
    }

    const folder = sanitizeSegment(String(form.get('folder') || 'products'), 'products')
    const productId = sanitizeSegment(String(form.get('productId') || form.get('product_id') || 'tmp'), 'tmp')
    const ext = extFromName(file.name) || (mime.split('/')[1] || 'bin')
    const storagePath = `${folder}/${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

    const supabase = getSupabase()
    const bytes = new Uint8Array(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: mime,
        upsert: false,
        cacheControl: '3600',
      })

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: uploadError.message || 'upload failed' },
        { status: 500 }
      )
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    const url = data.publicUrl
    const kind = inferKind(mime)

    return NextResponse.json({
      ok: true,

      // основные поля
      url,
      publicUrl: url,
      storagePath,
      path: storagePath,

      // совместимость
      media: { url, path: storagePath, storagePath, type: kind, mimeType: mime, size: file.size },
      file: { url, path: storagePath, storagePath, type: kind, mimeType: mime, size: file.size },

      bucket: BUCKET,
      type: kind,
      mimeType: mime,
      size: file.size,
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'unexpected upload error' },
      { status: 500 }
    )
  }
}
