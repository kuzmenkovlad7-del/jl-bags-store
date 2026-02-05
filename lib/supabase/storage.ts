import { supabase } from './client'

const BUCKET_NAME = 'product-media'

export async function uploadProductMedia(
  productCode: string,
  file: File,
  mediaType: 'image' | 'video'
): Promise<{ url: string; storagePath: string } | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${timestamp}.${fileExt}`
    const folder = mediaType === 'image' ? 'images' : 'video'
    const storagePath = `products/${productCode}/${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath)

    return { url: publicUrl, storagePath }
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

export async function deleteProductMedia(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath])
    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete error:', error)
    return false
  }
}
