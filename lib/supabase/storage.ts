import { supabase } from '@/lib/supabase/client'

const BUCKET_NAME = 'product-media'
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const MIME_SET = new Set([
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

export const ALLOWED_MIME_TYPES = Array.from(MIME_SET)

export type UploadKind = 'image' | 'video' | 'file'

export interface UploadResult {
  url: string
  publicUrl: string
  storagePath: string
  path: string
  bucket: string
  mimeType: string
  size: number
  kind: UploadKind
}

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

function normalizeMime(file: File): string {
  const raw = String(file.type || '').toLowerCase().trim()
  if (MIME_SET.has(raw)) return raw
  if (raw === 'image/jpg') return 'image/jpeg'

  const byExt = mimeFromExt(extFromName(file.name))
  if (byExt && MIME_SET.has(byExt)) return byExt

  return raw
}

function inferKind(mime: string): UploadKind {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  return 'file'
}

function normalizeStoragePath(input: string): string {
  let value = String(input || '').trim()
  if (!value) return ''

  // full public URL -> extract path after bucket
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value)
      const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
      const idx = u.pathname.indexOf(marker)
      if (idx >= 0) {
        value = u.pathname.slice(idx + marker.length)
      } else {
        value = u.pathname
      }
    } catch {
      // keep original
    }
  }

  value = value.replace(/^\/+/, '')
  value = value.replace(new RegExp(`^${BUCKET_NAME}/`), '')
  value = decodeURIComponent(value)
  return value
}

export function isAllowedMimeType(mime: string): boolean {
  const m = String(mime || '').toLowerCase().trim()
  return MIME_SET.has(m) || m === 'image/jpg'
}

export function isAllowedFileType(file: File): boolean {
  return isAllowedMimeType(normalizeMime(file))
}

export function validateFile(file: File): { ok: boolean; error?: string } {
  if (!file) return { ok: false, error: 'Файл не выбран' }
  if (file.size <= 0) return { ok: false, error: 'Пустой файл' }
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: `Максимум ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` }

  const mime = normalizeMime(file)
  if (!isAllowedMimeType(mime)) {
    return {
      ok: false,
      error: 'Неподдерживаемый формат. Разрешены JPG/PNG/WEBP/HEIC/HEIF/MP4/MOV/WEBM',
    }
  }

  return { ok: true }
}

export async function uploadFileDetailed(file: File, folder = 'products'): Promise<UploadResult> {
  const check = validateFile(file)
  if (!check.ok) throw new Error(check.error || 'Ошибка валидации файла')

  const mimeType = normalizeMime(file)
  const ext = extFromName(file.name) || (mimeFromExt(mimeType.split('/')[1] || '') ? mimeType.split('/')[1] : 'bin')
  const safeFolder = String(folder || 'products').replace(/[^a-zA-Z0-9/_-]/g, '')
  const storagePath = `${safeFolder}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(uploadError.message || 'Ошибка загрузки в storage')
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
  const publicUrl = data.publicUrl

  return {
    url: publicUrl,
    publicUrl,
    storagePath,
    path: storagePath,
    bucket: BUCKET_NAME,
    mimeType,
    size: file.size,
    kind: inferKind(mimeType),
  }
}

/**
 * ВАЖНО: uploadFile возвращает СТРОКУ URL для совместимости со старым кодом админки.
 */
export async function uploadFile(file: File, folder = 'products'): Promise<string> {
  const result = await uploadFileDetailed(file, folder)
  return result.url
}

export async function deleteFile(pathOrUrl: string): Promise<void> {
  const storagePath = normalizeStoragePath(pathOrUrl)
  if (!storagePath) return

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])
  if (error) {
    throw new Error(error.message || 'Ошибка удаления файла')
  }
}

export function getPublicUrl(pathOrUrl: string): string {
  const storagePath = normalizeStoragePath(pathOrUrl)
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)
  return data.publicUrl
}
