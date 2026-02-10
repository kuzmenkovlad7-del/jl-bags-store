'use client'

import { useMemo, useState } from 'react'
import { FileRejection, useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase/client'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  uploadFileDetailed,
} from '@/lib/supabase/storage'

type MediaKind = 'image' | 'video'

export interface AdminMediaItem {
  id?: string
  product_id?: string
  url: string
  publicUrl?: string
  path?: string
  storagePath?: string
  type?: MediaKind | string
  mimeType?: string
  size?: number
  position?: number
  is_primary?: boolean
  [key: string]: any
}

interface MediaUploadProps {
  productId?: string | number | null
  productCode?: string
  media?: AdminMediaItem[]
  value?: AdminMediaItem[]
  onChange?: (items: AdminMediaItem[]) => void
  onMediaChange?: (items: AdminMediaItem[]) => void
  onMediaUpdate?: () => Promise<void> | void
  disabled?: boolean
  className?: string
}

const BUCKET = 'product-media'
const MAX_FILES = 10
const PUBLIC_SEGMENT = `/storage/v1/object/public/${BUCKET}/`

const ACCEPT: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
}

function toMediaKind(input?: string): MediaKind {
  const v = String(input || '').toLowerCase()
  if (v === 'video' || v.startsWith('video/')) return 'video'
  return 'image'
}

function parseStoragePath(raw?: string): string {
  if (!raw) return ''
  const value = String(raw).trim()
  if (!value) return ''

  if (value.includes(PUBLIC_SEGMENT)) {
    const after = value.split(PUBLIC_SEGMENT)[1] || ''
    return decodeURIComponent((after.split('?')[0] || '').replace(/^\/+/, ''))
  }

  if (value.startsWith(`${BUCKET}/`)) {
    return value.slice(BUCKET.length + 1)
  }

  if (/^https?:\/\//i.test(value)) {
    return ''
  }

  return value.replace(/^\/+/, '')
}

function normalizeItem(item: Record<string, any>): AdminMediaItem {
  const url = item.url || item.publicUrl || ''
  const storagePath =
    item.storagePath || item.path || parseStoragePath(url)

  const type = toMediaKind(item.type || item.mimeType)

  return {
    ...item,
    url,
    publicUrl: item.publicUrl || url,
    storagePath,
    path: item.path || storagePath,
    type,
  }
}

function byPosition(a: AdminMediaItem, b: AdminMediaItem): number {
  return (a.position ?? 0) - (b.position ?? 0)
}

function unknownColumnLike(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('could not find') ||
    m.includes('column') ||
    m.includes('schema cache') ||
    m.includes('pgrst')
  )
}

async function insertProductMediaFlexible(params: {
  productId: string
  url: string
  path: string
  type: string
  position: number
  mimeType: string
  size: number
}): Promise<AdminMediaItem> {
  const { productId, url, path, type, position, mimeType, size } = params

  const attempts: Array<Record<string, any>> = [
    {
      product_id: productId,
      url,
      path,
      type,
      position,
      mime_type: mimeType,
      size,
    },
    {
      product_id: productId,
      url,
      path,
      type,
      position,
    },
    {
      product_id: productId,
      url,
      type,
      position,
    },
    {
      product_id: productId,
      url,
      position,
    },
  ]

  let lastError: any = null

  for (const payload of attempts) {
    const { data, error } = await supabase
      .from('product_media')
      .insert(payload)
      .select('*')
      .single()

    if (!error) {
      return normalizeItem(data || payload)
    }

    lastError = error
    const msg = String(error.message || '')
    if (!unknownColumnLike(msg)) {
      break
    }
  }

  throw lastError || new Error('Не удалось сохранить медиа в product_media')
}

export function MediaUpload({
  productId = null,
  productCode,
  media,
  value,
  onChange,
  onMediaChange,
  onMediaUpdate,
  disabled = false,
  className = '',
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const items = useMemo(
    () => (value ?? media ?? []).map(normalizeItem).sort(byPosition),
    [value, media]
  )

  const emit = (next: AdminMediaItem[]) => {
    onChange?.(next)
    onMediaChange?.(next)
  }

  const productIdStr =
    productId === null || productId === undefined ? '' : String(productId)

  const refreshFromDb = async (fallback?: AdminMediaItem[]) => {
    if (!productIdStr || productIdStr === 'new') {
      if (fallback) emit(fallback)
      return
    }

    const { data, error: readErr } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productIdStr)
      .order('position', { ascending: true })

    if (readErr) {
      if (fallback) emit(fallback)
      setError(readErr.message || 'Ошибка чтения media')
    } else {
      emit((data || []).map(normalizeItem))
    }

    await onMediaUpdate?.()
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (disabled || uploading) return

    if (!productIdStr || productIdStr === 'new') {
      setError('Сначала сохраните товар, потом загружайте фото/видео')
      return
    }

    if (!acceptedFiles.length) return

    const remain = MAX_FILES - items.length
    if (remain <= 0) {
      setError(`Можно загрузить максимум ${MAX_FILES} файлов`)
      return
    }

    const files = acceptedFiles.slice(0, remain)

    setUploading(true)
    setError('')

    try {
      const basePosition = items.length
      const created: AdminMediaItem[] = []

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]
        const mime = String(file.type || '').toLowerCase()

        if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
          throw new Error(`Неподдерживаемый формат: ${mime || file.name}`)
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `Файл слишком большой. Максимум ${Math.round(
              MAX_FILE_SIZE / 1024 / 1024
            )}MB`
          )
        }

        const uploaded = await uploadFileDetailed(file, `products/${productIdStr}`)
        const url = uploaded.publicUrl || uploaded.url
        const path = uploaded.storagePath || uploaded.path || ''
        const kind = toMediaKind(uploaded.kind || uploaded.mimeType)

        const row = await insertProductMediaFlexible({
          productId: productIdStr,
          url,
          path,
          type: kind,
          position: basePosition + i,
          mimeType: uploaded.mimeType || mime || '',
          size: uploaded.size || file.size,
        })

        created.push(row)
      }

      await refreshFromDb([...items, ...created])
    } catch (e: any) {
      const msg = String(e?.message || 'Ошибка загрузки')
      if (
        msg.toLowerCase().includes('mime type') &&
        msg.toLowerCase().includes('not supported')
      ) {
        setError(
          `${msg}. Добавьте HEIC/HEIF в настройки bucket product-media (allowed MIME types).`
        )
      } else {
        setError(msg)
      }
      console.error('Upload error:', e)
    } finally {
      setUploading(false)
    }
  }

  const onDropRejected = (rejections: FileRejection[]) => {
    if (!rejections.length) return
    const first = rejections[0]
    const reason = first.errors[0]?.code || 'file-invalid'
    if (reason === 'file-too-large') {
      setError(`Файл слишком большой. Максимум ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`)
      return
    }
    if (reason === 'too-many-files') {
      setError(`Можно загрузить максимум ${MAX_FILES} файлов`)
      return
    }
    setError('Неподдерживаемый формат файла')
  }

  const removeAt = async (index: number) => {
    const target = items[index]
    if (!target) return

    setError('')

    try {
      if (target.id) {
        const { error: dbErr } = await supabase
          .from('product_media')
          .delete()
          .eq('id', target.id)
        if (dbErr) throw dbErr
      } else if (productIdStr) {
        const { error: dbErr } = await supabase
          .from('product_media')
          .delete()
          .eq('product_id', productIdStr)
          .eq('url', target.url)
        if (dbErr) throw dbErr
      }

      const storagePath = parseStoragePath(
        target.path || target.storagePath || target.url
      )

      if (storagePath) {
        const { error: storageErr } = await supabase
          .storage
          .from(BUCKET)
          .remove([storagePath])

        if (storageErr) {
          console.warn('Storage remove warning:', storageErr.message)
        }
      }

      const next = items
        .filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, position: i }))

      await refreshFromDb(next)
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления файла')
      console.error('Remove error:', e)
    }
  }

  const setPrimary = async (index: number) => {
    const sorted = [...items].sort(byPosition)
    if (index < 0 || index >= sorted.length) return
    if (sorted.length <= 1) return

    const chosen = sorted[index]
    const rest = sorted.filter((_, i) => i !== index)
    const reordered = [chosen, ...rest]

    try {
      for (let i = 0; i < reordered.length; i += 1) {
        const row = reordered[i]
        if (!row.id) continue

        const { error: updErr } = await supabase
          .from('product_media')
          .update({ position: i })
          .eq('id', row.id)

        if (updErr) throw updErr
      }

      await refreshFromDb(
        reordered.map((m, i) => ({
          ...m,
          position: i,
          is_primary: i === 0,
        }))
      )
    } catch (e: any) {
      setError(e?.message || 'Ошибка установки главного фото')
      console.error('Set primary error:', e)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPT,
    disabled: disabled || uploading || items.length >= MAX_FILES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    maxFiles: Math.max(0, MAX_FILES - items.length),
  })

  const subtitleCode = productCode ? ` • ${productCode}` : ''

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">
          Фото и видео{subtitleCode}
        </p>
        <p className="text-xs text-muted-foreground">
          {items.length}/{MAX_FILES}
        </p>
      </div>

      <div
        {...getRootProps()}
        className={[
          'rounded-lg border-2 border-dashed p-5 text-center transition-colors',
          isDragActive ? 'border-black bg-black/5' : 'border-gray-300',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-2 text-4xl text-gray-400">⇧</div>
        <p className="text-base font-medium">
          {uploading ? 'Загрузка...' : 'Перетащите файлы сюда или нажмите'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          До {MAX_FILES} файлов, до {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB каждый
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG/PNG/WEBP/HEIC/HEIF/MP4/MOV/WEBM
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => {
            const isVideo = toMediaKind(item.type || item.mimeType) === 'video'
            const preview = item.url || item.publicUrl || ''
            const primary = index === 0

            return (
              <div
                key={`${item.id || item.url}-${index}`}
                className="group relative overflow-hidden rounded-md border bg-white"
              >
                <div className="aspect-square bg-gray-100">
                  {isVideo ? (
                    <video
                      src={preview}
                      className="h-full w-full object-cover"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={preview}
                      alt={`media-${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                {primary ? (
                  <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold">
                    PRIMARY
                  </span>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {!primary && (
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className="flex-1 rounded bg-white px-2 py-1 text-[11px] font-medium"
                    >
                      Главная
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="rounded bg-red-600 px-2 py-1 text-[11px] font-medium text-white"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MediaUpload
