import { supabase } from '@/lib/supabase'

const BUCKET_NAME = 'product-media'
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

const ALLOWED_MIME_TYPES = new Set([
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

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

function normalizePath(path: string): string {
  return String(path || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/{2,}/g, '/')
}

function extFromName(name: string): string {
  const n = String(name || '')
  const i = n.lastIndexOf('.')
  return i >= 0 ? n.slice(i + 1).toLowerCase() : ''
}

function inferMime(file: File): string {
  const t = String(file.type || '').toLowerCase()
  if (t) return t
  const ext = extFromName(file.name)
  return EXT_TO_MIME[ext] || ''
}

function sanitizeFileName(name: string): string {
  const n = String(name || 'file')
  return n.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function ensurePath(storagePath: string, file: File): string {
  const p = normalizePath(storagePath)
  if (!p) {
    const ext = extFromName(file.name) || 'bin'
    return `products/common/${Date.now()}-${crypto.randomUUID()}.${ext}`
  }

  // если пришла папка, добавляем файл
  if (p.endsWith('/')) {
    const ext = extFromName(file.name) || 'bin'
    const name = sanitizeFileName(file.name || `file.${ext}`)
    return `${p}${Date.now()}-${name}`
  }

  return p
}

function extractStoragePath(pathOrUrl: string): string {
  const val = String(pathOrUrl || '').trim()
  if (!val) return ''

  const marker = `/storage/v1/object/public/${BUCKET_NAME}/`
  if (val.includes(marker)) {
    return decodeURIComponent(val.split(marker)[1] || '')
  }

  return normalizePath(val)
}

export async function uploadFile(file: File, storagePath: string): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error('Файл не передан')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(1)}MB. Лимит 100MB`)
  }

  const mime = inferMime(file)
  if (!mime || !ALLOWED_MIME_TYPES.has(mime)) {
    throw new Error(`Неподдерживаемый тип файла: ${file.type || extFromName(file.name) || 'unknown'}`)
  }

  const finalPath = ensurePath(storagePath, file)

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(finalPath, file, {
    upsert: true,
    contentType: mime,
    cacheControl: '3600',
  })

  if (error) {
    throw new Error(`Ошибка Storage: ${error.message}`)
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(finalPath)
  return data.publicUrl
}

export async function deleteFile(storagePathOrUrl: string): Promise<void> {
  const storagePath = extractStoragePath(storagePathOrUrl)
  if (!storagePath) return

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])
  if (error) {
    throw new Error(`Ошибка удаления файла: ${error.message}`)
  }
}

export function getPublicUrl(storagePath: string): string {
  const path = normalizePath(storagePath)
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
  return data.publicUrl
}
