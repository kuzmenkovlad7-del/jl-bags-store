import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string
    const productCode = formData.get('productCode') as string

    if (!file || !productId || !productCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const isVideo = file.type.startsWith('video/')
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${timestamp}.${fileExt}`
    const folder = isVideo ? 'video' : 'images'
    const storagePath = `products/${productCode}/${folder}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('product-media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-media').getPublicUrl(storagePath)

    // Get max position
    const { data: existingMedia } = await supabase
      .from('product_media')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1)

    const maxPosition = existingMedia?.[0]?.position ?? -1

    // Save to DB
    const { data: mediaRecord, error: dbError } = await supabase
      .from('product_media')
      .insert({
        product_id: productId,
        media_type: isVideo ? 'video' : 'photo',
        url: publicUrl,
        storage_path: storagePath,
        position: maxPosition + 1,
        is_primary: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ media: mediaRecord })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
