'use client'

import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  removeFile,
  uploadFileDetailed,
} from '@/lib/supabase/storage'

type MediaKind = 'image' | 'video'

export type MediaItem = {
  id?: string
  url: string
  publicUrl?: string
  path?: string
  storagePath?: string
  type?: MediaKind | string
  mimeType?: string
  size?: number
  position?: number
  is_primary?: boolean
}

type MediaUploadProps = {
  value?: MediaItem[]
  onChange?: (next: MediaItem[]) => void
  productId?: string | number | null
  disabled?: boolean
  className?: string
  [key: string]: unknown
}

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

function normalizeItem(item: MediaItem): MediaItem {
  const url = item.url || item.publicUrl || ''
  return {
    ...item,
    url,
    publicUrl: item.publicUrl || url,
    storagePath: item.storagePath || item.path,
    path: item.path || item.storagePath,
    type: item.type || (item.mimeType?.startsWith('video/') ? 'video' : 'image'),
  }
}

export default function MediaUpload({
  value = [],
  onChange,
  productId = 'new',
  disabled = false,
  className = '',
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const media = useMemo(() => (value || []).map(normalizeItem), [value])

  const onDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length || disabled || uploading) return

    setUploading(true)
    setError('')

    try {
      const uploaded: MediaItem[] = []

      for (const file of acceptedFiles) {
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`Неподдерживаемый формат: ${file.type || file.name}`)
        }

        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`Файл слишком большой. Максимум ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`)
        }

        // ВАЖНО: прямой upload в Supabase, без /api/admin/media/upload
        const result = await uploadFileDetailed(file, `products/${productId}`)
        if (!result.ok) throw new Error(result.error || 'Upload failed')

        uploaded.push({
          id: crypto.randomUUID(),
          url: result.url,
          publicUrl: result.publicUrl,
          storagePath: result.storagePath,
          path: result.path,
          type: result.type,
          mimeType: result.mimeType,
          size: result.size,
          position: media.length + uploaded.length,
          is_primary: media.length + uploaded.length === 0,
        })
      }

      onChange?.([...media, ...uploaded])
    } catch (e: any) {
      const msg = e?.message || 'Ошибка загрузки'
      setError(msg)
      console.error('Upload error:', e)
    } finally {
      setUploading(false)
    }
  }

  const removeAt = async (index: number) => {
    const item = media[index]
    if (!item) return

    try {
      const storageRef = item.storagePath || item.path || item.url
      if (storageRef) await removeFile(storageRef)
    } catch (e) {
      console.error('Delete media error:', e)
    }

    const next = media
      .filter((_, i) => i !== index)
      .map((m, i) => ({ ...m, position: i }))

    if (next.length > 0 && !next.some((m) => m.is_primary)) {
      next[0].is_primary = true
    }

    onChange?.(next)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    disabled: disabled || uploading,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={[
          'rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          isDragActive ? 'border-black bg-black/5' : 'border-gray-300',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-3 text-4xl text-gray-400">⇧</div>

        <p className="text-lg font-medium">
          {uploading ? 'Загрузка...' : 'Перетащите файлы сюда или нажмите'}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Максимум {Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB, JPG/PNG/WEBP/HEIC/HEIF/MP4/MOV/WEBM
        </p>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {media.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item, index) => {
            const isVideo = String(item.type || '').startsWith('video')
            return (
              <div key={`${item.url}-${index}`} className="group relative overflow-hidden rounded-md border bg-white">
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
                      alt={`media-${index}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Удалить"
                >
                  ✕
                </button>

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
