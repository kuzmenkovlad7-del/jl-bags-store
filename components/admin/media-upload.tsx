'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductMedia } from '@/lib/types'
import { ta } from '@/lib/admin-i18n'
import Image from 'next/image'

interface MediaUploadProps {
  productId: string
  productCode: string
  media: ProductMedia[]
  onMediaUpdate: () => void
}

export function MediaUpload({ productId, productCode, media, onMediaUpdate }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'video/*': ['.mp4', '.webm'],
    },
    maxSize: 10485760, // 10MB
    onDrop: async (acceptedFiles) => {
      if (!acceptedFiles.length) return
      setUploading(true)

      try {
        for (const file of acceptedFiles) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('productId', productId)
          formData.append('productCode', productCode)

          const res = await fetch('/api/admin/media/upload', {
            method: 'POST',
            body: formData,
          })

          if (!res.ok) throw new Error('Upload failed')
        }

        onMediaUpdate()
      } catch (error) {
        console.error('Upload error:', error)
        alert(ta('media.errorUpload'))
      } finally {
        setUploading(false)
      }
    },
  })

  async function handleDelete(mediaId: string, storagePath?: string) {
    if (!confirm(ta('media.confirmDelete'))) return

    try {
      const res = await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, storagePath }),
      })

      if (!res.ok) throw new Error('Delete failed')
      onMediaUpdate()
    } catch (error) {
      console.error('Delete error:', error)
      alert(ta('media.errorDelete'))
    }
  }

  async function handleSetPrimary(mediaId: string) {
    try {
      const res = await fetch('/api/admin/media/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, productId }),
      })

      if (!res.ok) throw new Error('Set primary failed')
      onMediaUpdate()
    } catch (error) {
      console.error('Set primary error:', error)
      alert(ta('common.error'))
    }
  }

  const photos = media.filter((m) => m.media_type === 'photo')
  const videos = media.filter((m) => m.media_type === 'video')

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
        {uploading ? (
          <p className="text-sm text-gray-600">{ta('media.uploading')}</p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-1">{ta('media.dragDrop')}</p>
            <p className="text-xs text-gray-400">{ta('media.maxSize')}</p>
          </>
        )}
      </div>

      {photos.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">{ta('media.photos')} ({photos.length})</h4>
          <div className="grid grid-cols-4 gap-4">
            {photos.map((item) => (
              <div key={item.id} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image src={item.url} alt="" fill className="object-cover" />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!item.is_primary && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleSetPrimary(item.id)}
                    >
                      {ta('media.setPrimary')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDelete(item.id, item.storage_path)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {item.is_primary && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                    {ta('media.setPrimary')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">{ta('media.videos')} ({videos.length})</h4>
          <div className="space-y-2">
            {videos.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Video className="h-5 w-5 text-gray-400" />
                <span className="text-sm flex-1 truncate">{item.url}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(item.id, item.storage_path)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
