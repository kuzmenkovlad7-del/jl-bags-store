'use client'

import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Loader2, Star, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  uploadFileDetailed,
} from '@/lib/supabase/storage'

type MediaKind = 'image' | 'video' | 'file'

export interface AdminMediaItem {
  id?: string
  url: string
  publicUrl?: string
  storagePath?: string
  storage_path?: string
  path?: string
  type?: MediaKind | string
  mimeType?: string
  mime_type?: string
  size?: number
  position?: number
  is_primary?: boolean
}

interface MediaUploadProps {
  value?: AdminMediaItem[]
  media?: AdminMediaItem[]
  onChange?: (items: AdminMediaItem[]) => void
  onMediaChange?: (items: AdminMediaItem[]) => void
  onMediaUpdate?: () => Promise<void> | void
  productId?: string | number | null
  productCode?: string
  folder?: string
  disabled?: boolean
  className?: string
}

const BUCKET = 'product-media'
const PUBLIC_SEGMENT = `/storage/v1/object/public/${BUCKET}/`

const ACCEPT: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/webm': ['.webm'],
}

function toMediaKind(mimeType?: string, type?: string): MediaKind {
  if (type === 'video' || String(mimeType || '').startsWith('video/')) return 'video'
  if (type === 'file') return 'file'
  return 'image'
}

function normalizeStoragePath(raw?: string): string {
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

function normalizeItem(item: AdminMediaItem): AdminMediaItem {
  const anyItem = item as any
  const url = anyItem.url || anyItem.publicUrl || ''
  const mimeType = anyItem.mimeType || anyItem.mime_type || ''
  const storagePath =
    anyItem.storagePath ||
    anyItem.storage_path ||
    anyItem.path ||
    normalizeStoragePath(url)

  return {
    ...anyItem,
    url,
    publicUrl: anyItem.publicUrl || url,
    mimeType,
    storagePath,
    path: anyItem.path || storagePath,
    type: toMediaKind(mimeType, anyItem.type),
  }
}

async function insertMediaRow(
  productId: string,
  item: AdminMediaItem,
  position: number,
  isPrimary: boolean
): Promise<void> {
  const candidates = [
    {
      product_id: productId,
      url: item.url,
      path: item.storagePath || item.path || null,
      storage_path: item.storagePath || item.path || null,
      type: item.type || toMediaKind(item.mimeType),
      mime_type: item.mimeType || null,
      size: item.size || null,
      position,
      is_primary: isPrimary,
    },
    {
      product_id: productId,
      url: item.url,
      path: item.storagePath || item.path || null,
      type: item.type || toMediaKind(item.mimeType),
      mime_type: item.mimeType || null,
      size: item.size || null,
      position,
      is_primary: isPrimary,
    },
    {
      product_id: productId,
      url: item.url,
      type: item.type || toMediaKind(item.mimeType),
      position,
      is_primary: isPrimary,
    },
  ]

  let lastError: any = null

  for (const payload of candidates) {
    const { error } = await supabase.from('product_media').insert(payload as any)
    if (!error) return

    lastError = error
    const msg = String(error.message || '').toLowerCase()
    const retryable =
      msg.includes('column') ||
      msg.includes('schema cache') ||
      msg.includes('does not exist') ||
      msg.includes('could not find')

    if (!retryable) break
  }

  throw new Error(lastError?.message || 'Не удалось создать запись media в БД')
}

function buildUploadFolder(folder?: string, productId?: string | number | null, productCode?: string): string {
  if (folder && String(folder).trim()) return String(folder).trim()
  if (productCode && String(productCode).trim()) return `products/${String(productCode).trim()}`
  if (productId && String(productId).trim() && String(productId) !== 'new') return `products/${String(productId).trim()}`
  return 'products/new'
}

export function MediaUpload({
  value,
  media,
  onChange,
  onMediaChange,
  onMediaUpdate,
  productId = 'new',
  productCode,
  folder,
  disabled = false,
  className = '',
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const items = useMemo(
    () => (value ?? media ?? []).map((it) => normalizeItem(it)),
    [value, media]
  )

  const realProductId =
    productId !== null &&
    productId !== undefined &&
    String(productId).trim() !== '' &&
    String(productId) !== 'new'

  const uploadFolder = buildUploadFolder(folder, productId, productCode)

  const emit = (next: AdminMediaItem[]) => {
    onChange?.(next)
    onMediaChange?.(next)
  }

  const onDrop = async (acceptedFiles: File[]) => {
    if (disabled || uploading || acceptedFiles.length === 0) return

    setUploading(true)
    setError('')

    try {
      const uploaded: AdminMediaItem[] = []

      for (const file of acceptedFiles) {
        const mime = String(file.type || '').toLowerCase()
        if (!ALLOWED_MIME_TYPES.includes(mime)) {
          throw new Error('Неподдерживаемый формат файла')
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Файл слишком большой. Максимум ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`)
        }

        const result = await uploadFileDetailed(file, uploadFolder)

        const nextPosition = items.length + uploaded.length
        const isPrimary = nextPosition === 0

        const newItem: AdminMediaItem = {
          id: crypto.randomUUID(),
          url: result.url,
          publicUrl: result.publicUrl || result.url,
          storagePath: result.storagePath || result.path || normalizeStoragePath(result.url),
          path: result.path || result.storagePath,
          type: result.kind || toMediaKind(result.mimeType),
          mimeType: result.mimeType,
          size: result.size,
          position: nextPosition,
          is_primary: isPrimary,
        }

        if (realProductId) {
          await insertMediaRow(String(productId), newItem, nextPosition, isPrimary)
        }

        uploaded.push(newItem)
      }

      emit([...items, ...uploaded])

      if (realProductId) {
        await Promise.resolve(onMediaUpdate?.())
      }
    } catch (e: any) {
      const msg = e?.message || 'Ошибка загрузки'
      setError(msg)
      console.error('Upload error:', e)
    } finally {
      setUploading(false)
    }
  }

  const removeAt = async (index: number) => {
    const target = items[index]
    if (!target || disabled || uploading) return

    setUploading(true)
    setError('')

    try {
      if (realProductId) {
        if (target.id) {
          const { error: dbErr } = await supabase.from('product_media').delete().eq('id', target.id)
          if (dbErr) throw new Error(dbErr.message || 'Ошибка удаления media из БД')
        } else {
          const { error: dbErr } = await supabase
            .from('product_media')
            .delete()
            .eq('product_id', String(productId))
            .eq('url', target.url)
          if (dbErr) throw new Error(dbErr.message || 'Ошибка удаления media из БД')
        }
      }

      const storagePath = normalizeStoragePath(target.storagePath || target.path || target.url)
      if (storagePath) {
        const { error: storageErr } = await supabase.storage.from(BUCKET).remove([storagePath])
        if (storageErr) {
          console.warn('Storage remove warning:', storageErr.message)
        }
      }

      const next = items
        .filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, position: i, is_primary: i === 0 }))

      emit(next)

      if (realProductId) {
        await Promise.resolve(onMediaUpdate?.())
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления')
      console.error('Remove media error:', e)
    } finally {
      setUploading(false)
    }
  }

  const setPrimary = async (index: number) => {
    const target = items[index]
    if (!target || disabled || uploading) return

    try {
      if (realProductId && target.id) {
        const { error: resetErr } = await supabase
          .from('product_media')
          .update({ is_primary: false })
          .eq('product_id', String(productId))
        if (resetErr) throw new Error(resetErr.message || 'Ошибка сброса primary')

        const { error: setErr } = await supabase
          .from('product_media')
          .update({ is_primary: true })
          .eq('id', target.id)
        if (setErr) throw new Error(setErr.message || 'Ошибка установки primary')

        await Promise.resolve(onMediaUpdate?.())
        return
      }

      const next = items.map((m, i) => ({ ...m, is_primary: i === index }))
      emit(next)
    } catch (e: any) {
      setError(e?.message || 'Ошибка установки primary')
      console.error('Set primary error:', e)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_FILE_SIZE,
    disabled: disabled || uploading,
    multiple: true,
  })

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={[
          'rounded-lg border-2 border-dashed p-6 text-center transition',
          isDragActive ? 'border-black bg-muted/50' : 'border-gray-300',
          disabled || uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-black/60',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-2 h-9 w-9 text-muted-foreground" />
        <p className="text-sm font-medium">
          {uploading ? 'Загрузка...' : 'Перетащите файлы сюда или нажмите'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Максимум 100MB, JPG/PNG/WEBP/HEIC/HEIF/MP4/MOV/WEBM
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {uploading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Обрабатываю файлы...
        </div>
      ) : null}

      {items.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item, index) => {
            const isVideo = toMediaKind(item.mimeType, item.type) === 'video'
            return (
              <div
                key={`${item.id || item.url}-${index}`}
                className="group relative overflow-hidden rounded-md border bg-white"
              >
                <div className="aspect-square bg-gray-100">
                  {isVideo ? (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="absolute right-2 top-2 flex gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => setPrimary(index)}
                    disabled={disabled || uploading}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${item.is_primary ? 'fill-yellow-400 text-yellow-500' : ''}`}
                    />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => removeAt(index)}
                    disabled={disabled || uploading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {item.is_primary ? (
                  <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold">
                    PRIMARY
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
