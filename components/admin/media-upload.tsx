'use client'

import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Star, Upload, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { MAX_FILE_SIZE, uploadFileDetailed, validateFile } from '@/lib/supabase/storage'

type MediaKind = 'image' | 'video'

const HEIC_EXTENSIONS = ['heic', 'heif']
const HEIC_MIMES = ['image/heic', 'image/heif']

function isHeicFile(file: File): boolean {
  const mime = String(file.type || '').toLowerCase()
  if (HEIC_MIMES.includes(mime)) return true
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return HEIC_EXTENSIONS.includes(ext)
}

async function convertHeicToJpeg(file: File): Promise<File> {
  // Dynamic import keeps heic2any out of SSR bundle
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  const blob = Array.isArray(result) ? result[0] : result
  const newName = file.name.replace(/\.hei[cf]$/i, '.jpg')
  return new File([blob], newName, { type: 'image/jpeg' })
}

export interface AdminMediaItem {
  id?: string
  product_id?: string
  url: string
  publicUrl?: string
  storagePath?: string
  path?: string
  type?: MediaKind | string
  media_type?: MediaKind | string
  mimeType?: string | null
  mime_type?: string | null
  size?: number | null
  position?: number
  is_primary?: boolean
}

interface MediaUploadProps {
  value?: AdminMediaItem[]
  media?: AdminMediaItem[]
  onChange?: (items: AdminMediaItem[]) => void
  onMediaChange?: (items: AdminMediaItem[]) => void
  onMediaUpdate?: () => void | Promise<void>
  productId?: string | number | null
  productCode?: string
  folder?: string
  maxFiles?: number
  disabled?: boolean
  className?: string
}

const BUCKET = 'product-media'
const PUBLIC_SEGMENT = `/storage/v1/object/public/${BUCKET}/`

const VIDEO_MIME_PREFIXES = ['video/']
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'avi', 'mkv', 'm4v']
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif', 'bmp', 'tiff', 'tif']

function toMediaKind(mimeType?: string | null, rawType?: string | null, fileName?: string | null): MediaKind {
  const raw = String(rawType || '').toLowerCase()
  if (raw === 'video') return 'video'
  if (raw === 'image') return 'image'

  const mime = String(mimeType || '').toLowerCase()
  for (const prefix of VIDEO_MIME_PREFIXES) {
    if (mime.startsWith(prefix)) return 'video'
  }
  if (mime.startsWith('image/')) return 'image'

  // fallback by file extension
  if (fileName) {
    const ext = String(fileName).toLowerCase().split('.').pop() || ''
    if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  }

  return 'image'
}

function normalizeStoragePath(raw?: string): string {
  if (!raw) return ''
  let value = String(raw).trim()
  if (!value) return ''

  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value)
      const idx = u.pathname.indexOf(PUBLIC_SEGMENT)
      if (idx >= 0) {
        value = u.pathname.slice(idx + PUBLIC_SEGMENT.length)
      } else {
        value = u.pathname
      }
    } catch {
      return ''
    }
  }

  value = value.replace(/^\/+/, '')
  value = value.replace(new RegExp(`^${BUCKET}/`), '')
  return decodeURIComponent(value)
}

function normalizeItem(item: AdminMediaItem, index: number): AdminMediaItem {
  const url = item.url || item.publicUrl || ''
  const mime = item.mimeType ?? item.mime_type ?? null
  const kind = toMediaKind(mime, (item.type as string) || (item.media_type as string) || null)
  const storagePath = item.storagePath || item.path || normalizeStoragePath(url)

  return {
    ...item,
    url,
    publicUrl: item.publicUrl || url,
    storagePath,
    path: item.path || storagePath,
    mimeType: mime,
    mime_type: mime,
    type: kind,
    media_type: kind,
    position: typeof item.position === 'number' ? item.position : index,
    is_primary: Boolean(item.is_primary),
  }
}

function normalizeList(list: AdminMediaItem[]): AdminMediaItem[] {
  const normalized = list.map((item, i) => normalizeItem(item, i))
  return normalized.map((item, i) => ({
    ...item,
    position: i,
    is_primary: i === 0,
  }))
}

function asPersistableProductId(productId: string | number | null | undefined): string | null {
  const v = String(productId ?? '').trim()
  if (!v || v === 'new' || v === 'null' || v === 'undefined') return null
  return v
}

async function insertProductMediaRow(
  productId: string,
  item: AdminMediaItem,
  position: number
): Promise<AdminMediaItem> {
  const mediaType = toMediaKind(item.mimeType ?? item.mime_type ?? null, (item.type as string) || null)

  const payloads: Array<Record<string, any>> = [
    {
      product_id: productId,
      url: item.url,
      media_type: mediaType,
      position,
      mime_type: item.mimeType ?? item.mime_type ?? null,
      size: item.size ?? null,
    },
    {
      product_id: productId,
      url: item.url,
      media_type: mediaType,
      position,
    },
    // fallback для возможной старой схемы
    {
      product_id: productId,
      url: item.url,
      type: mediaType,
      position,
    },
  ]

  let lastError: any = null

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from('product_media')
      .insert(payload)
      .select('*')
      .single()

    if (!error) {
      const row = (data as any) || {}
      return normalizeItem(
        {
          ...item,
          id: row.id ?? item.id,
          product_id: row.product_id ?? productId,
          url: row.url ?? item.url,
          media_type: row.media_type ?? mediaType,
          type: row.type ?? mediaType,
          mime_type: row.mime_type ?? item.mimeType ?? null,
          mimeType: row.mime_type ?? item.mimeType ?? null,
          size: row.size ?? item.size ?? null,
          position,
        },
        position
      )
    }

    lastError = error
    const msg = String(error.message || '').toLowerCase()
    const retryable =
      msg.includes('column') ||
      msg.includes('schema cache') ||
      msg.includes('null value') ||
      msg.includes('does not exist')

    if (!retryable) break
  }

  throw lastError || new Error('Не удалось сохранить медиа в product_media')
}

async function replaceProductMediaRows(productId: string, items: AdminMediaItem[]): Promise<AdminMediaItem[]> {
  const normalized = normalizeList(items)

  const del = await supabase.from('product_media').delete().eq('product_id', productId)
  if (del.error) {
    throw del.error
  }

  if (!normalized.length) return []

  const result: AdminMediaItem[] = []
  for (let i = 0; i < normalized.length; i += 1) {
    const row = await insertProductMediaRow(productId, normalized[i], i)
    result.push(row)
  }

  return normalizeList(result)
}

export function MediaUpload({
  value,
  media,
  onChange,
  onMediaChange,
  onMediaUpdate,
  productId = null,
  productCode,
  folder,
  maxFiles = 10,
  disabled = false,
  className = '',
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const items = useMemo(() => normalizeList((value ?? media ?? []) as AdminMediaItem[]), [value, media])

  const emit = (next: AdminMediaItem[]) => {
    const normalized = normalizeList(next)
    onChange?.(normalized)
    onMediaChange?.(normalized)
  }

  const persistId = asPersistableProductId(productId)
  const uploadFolder = folder || `products/${persistId || 'new'}`

  const saveAndEmit = async (next: AdminMediaItem[]) => {
    const normalized = normalizeList(next)

    if (!persistId) {
      emit(normalized)
      return
    }

    const persisted = await replaceProductMediaRows(persistId, normalized)
    emit(persisted)
    await onMediaUpdate?.()
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (disabled || uploading) return
    if (!acceptedFiles.length) return

    setUploading(true)
    setError('')

    const fileErrors: string[] = []
    const uploaded: AdminMediaItem[] = []

    try {
      if (items.length >= maxFiles) {
        throw new Error(`Можно загрузить максимум ${maxFiles} файлов`)
      }
      const slotsLeft = maxFiles - items.length
      const filesToProcess = acceptedFiles.slice(0, slotsLeft)
      if (acceptedFiles.length > slotsLeft) {
        fileErrors.push(`Загружено первых ${slotsLeft} из ${acceptedFiles.length} файлов (лимит ${maxFiles})`)
      }

      for (const rawFile of filesToProcess) {
        let file = rawFile

        // HEIC/HEIF → JPEG conversion
        if (isHeicFile(rawFile)) {
          try {
            file = await convertHeicToJpeg(rawFile)
          } catch (convErr: any) {
            fileErrors.push(`${rawFile.name}: не удалось конвертировать HEIC/HEIF — ${String(convErr?.message || convErr)}`)
            continue // skip this file, process others
          }
        }

        const check = validateFile(file)
        if (!check.ok) {
          fileErrors.push(`${file.name}: ${check.error || 'Неподдерживаемый формат'}`)
          continue
        }

        try {
          const result = await uploadFileDetailed(file, uploadFolder)
          const kind = toMediaKind(result.mimeType, result.kind, file.name)

          uploaded.push(
            normalizeItem(
              {
                id: crypto.randomUUID(),
                url: result.publicUrl || result.url,
                publicUrl: result.publicUrl || result.url,
                storagePath: result.storagePath || result.path,
                path: result.path || result.storagePath,
                type: kind,
                media_type: kind,
                mimeType: result.mimeType,
                mime_type: result.mimeType,
                size: result.size,
                position: items.length + uploaded.length,
                is_primary: items.length + uploaded.length === 0,
              },
              items.length + uploaded.length
            )
          )
        } catch (uploadErr: any) {
          const raw = String(uploadErr?.message || 'Ошибка загрузки')
          if (raw.toLowerCase().includes('mime type') && raw.toLowerCase().includes('not supported')) {
            fileErrors.push(`${file.name}: формат отклонён хранилищем — разрешите MIME в Supabase Storage`)
          } else {
            fileErrors.push(`${file.name}: ${raw}`)
          }
        }
      }

      if (uploaded.length > 0) {
        const next = normalizeList([...items, ...uploaded]).slice(0, maxFiles)
        await saveAndEmit(next)
      }

      if (fileErrors.length > 0) {
        setError(fileErrors.join('\n'))
      }
    } catch (e: any) {
      setError(String(e?.message || 'Ошибка загрузки'))
      console.error('Media upload error:', e)
    } finally {
      setUploading(false)
    }
  }

  const removeAt = async (index: number) => {
    const target = items[index]
    if (!target) return

    setError('')
    const next = normalizeList(items.filter((_, i) => i !== index))
    emit(next)

    try {
      const storagePath = normalizeStoragePath(target.storagePath || target.path || target.url)
      if (storagePath) {
        const rm = await supabase.storage.from(BUCKET).remove([storagePath])
        if (rm.error) {
          console.warn('Storage remove warning:', rm.error.message)
        }
      }
      await saveAndEmit(next)
    } catch (e: any) {
      setError(String(e?.message || 'Ошибка удаления файла'))
      console.error('Media remove error:', e)
    }
  }

  const setPrimary = async (index: number) => {
    if (index < 0 || index >= items.length) return
    const next = normalizeList(
      items.map((it, i) => ({
        ...it,
        is_primary: i === index,
      }))
    )
    emit(next)

    try {
      await saveAndEmit(next)
    } catch (e: any) {
      setError(String(e?.message || 'Ошибка сохранения порядка медиа'))
      console.error('Media reorder error:', e)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    disabled: disabled || uploading,
  })

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium">{productCode ? `Фото и видео • ${productCode}` : 'Фото и видео'}</span>
        <span>
          {items.length}/{maxFiles}
        </span>
      </div>

      <div
        {...getRootProps()}
        className={[
          'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          isDragActive ? 'border-black bg-black/5' : 'border-gray-300',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 h-10 w-10 text-gray-400" />
        <p className="text-lg font-medium">{uploading ? 'Загрузка...' : 'Перетащите файлы сюда или нажмите'}</p>
        <p className="mt-1 text-sm text-gray-500">До {maxFiles} файлов, до {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB каждый</p>
        <p className="mt-1 text-sm text-gray-500">JPG/PNG/WEBP/HEIC/HEIF/MP4/MOV/WEBM</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => {
            const kind = toMediaKind(item.mimeType ?? item.mime_type ?? null, (item.type as string) || null)
            return (
              <div
                key={`${item.id || item.url}-${index}`}
                className="group relative overflow-hidden rounded-md border bg-white"
              >
                <div className="aspect-square bg-gray-100">
                  {kind === 'video' ? (
                    <video
                      src={item.publicUrl || item.url}
                      className="h-full w-full object-cover"
                      muted
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={item.publicUrl || item.url}
                      alt={`media-${index}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute right-2 top-2 rounded bg-black/70 p-1 text-white opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                  aria-label="Удалить медиа"
                >
                  <X className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className="absolute left-2 top-2 rounded bg-white/90 p-1"
                  aria-label="Сделать основным"
                >
                  <Star className={`h-4 w-4 ${item.is_primary ? 'fill-current' : ''}`} />
                </button>

                {item.is_primary ? (
                  <span className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold">
                    Основное
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MediaUpload
