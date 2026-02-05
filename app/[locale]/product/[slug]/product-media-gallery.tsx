'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Product, ProductMedia } from '@/lib/types'
import { Locale } from '@/lib/i18n'
import { X } from 'lucide-react'

interface ProductMediaGalleryProps {
  product: Product
  locale: Locale
  name: string
}

export function ProductMediaGallery({ product, name }: ProductMediaGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Separate photos and videos
  const photos = product.media?.filter((m) => m.media_type === 'photo') || []
  const videos = product.media?.filter((m) => m.media_type === 'video') || []

  // Find primary photo or use first photo
  const primaryPhoto = photos.find((m) => m.is_primary) || photos[0]
  const currentImage = photos[selectedImageIndex]

  const openModal = useCallback((index: number) => {
    setSelectedImageIndex(index)
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  const nextImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev + 1) % photos.length)
  }, [photos.length])

  const prevImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }, [photos.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, closeModal, nextImage, prevImage])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  // Early return after all hooks
  if (!product.media || product.media.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
          <span className="text-6xl font-bold text-muted-foreground">
            {product.code}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      {currentImage && (
        <div
          className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in"
          onClick={() => openModal(selectedImageIndex)}
        >
          <Image
            src={currentImage.url}
            alt={name}
            fill
            className="object-cover"
            priority={currentImage.is_primary}
          />
          {currentImage.is_primary && (
            <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
              Primary
            </div>
          )}
        </div>
      )}

      {/* Thumbnail Grid */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {photos.map((media, index) => (
            <button
              key={media.id}
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 transition-all ${
                selectedImageIndex === index
                  ? 'ring-2 ring-primary'
                  : 'hover:ring-2 hover:ring-gray-300'
              }`}
            >
              <Image
                src={media.url}
                alt={`${name} - ${index + 1}`}
                fill
                className="object-cover"
              />
              {media.is_primary && (
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">★</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="relative aspect-video overflow-hidden rounded-lg bg-gray-100">
              <video
                src={video.url}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Enlarged Image */}
      {isModalOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X size={32} />
          </button>

          {/* Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors text-4xl font-bold"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors text-4xl font-bold"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.url}
              alt={`${name} - ${selectedImageIndex + 1}`}
              width={1200}
              height={1200}
              className="object-contain max-h-full w-auto"
            />
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  )
}
