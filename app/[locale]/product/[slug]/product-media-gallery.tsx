'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Product, ProductMedia } from '@/lib/types'
import { Locale } from '@/lib/i18n'

interface ProductMediaGalleryProps {
  product: Product
  locale: Locale
  name: string
}

function isVideoMedia(m: ProductMedia): boolean {
  return m.media_type === 'video'
}

export function ProductMediaGallery({ product, name }: ProductMediaGalleryProps) {
  const allMedia: ProductMedia[] = product.media ?? []

  const [selectedIndex, setSelectedIndex] = useState(0)

  if (allMedia.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          <span className="text-6xl font-bold text-muted-foreground">{product.code}</span>
        </div>
      </div>
    )
  }

  const selected = allMedia[selectedIndex] ?? allMedia[0]
  const selectedIsVideo = isVideoMedia(selected)

  return (
    <div className="space-y-3">
      {/* Selected media — adaptive ratio, object-contain */}
      <div className="relative w-full overflow-hidden rounded-lg bg-gray-100" style={{ minHeight: 280 }}>
        {selectedIsVideo ? (
          <video
            key={selected.url}
            src={selected.url}
            controls
            muted
            playsInline
            preload="metadata"
            className="block max-h-[70vh] w-full object-contain"
            style={{ maxHeight: '70vh' }}
          />
        ) : (
          <div className="relative w-full" style={{ paddingBottom: '100%' }}>
            <Image
              src={selected.url}
              alt={name}
              fill
              className="object-contain"
              priority={selected.is_primary}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allMedia.map((item, index) => {
            const isVideo = isVideoMedia(item)
            const isActive = index === selectedIndex
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={[
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100 transition-all',
                  isActive
                    ? 'ring-2 ring-black ring-offset-1'
                    : 'opacity-70 hover:opacity-100 hover:ring-2 hover:ring-gray-400',
                ].join(' ')}
                aria-label={isVideo ? `Видео ${index + 1}` : `Фото ${index + 1}`}
              >
                {isVideo ? (
                  <>
                    <video
                      src={item.url}
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    {/* Play icon overlay for video thumbnails */}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </>
                ) : (
                  <Image
                    src={item.url}
                    alt={`${name} - ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
