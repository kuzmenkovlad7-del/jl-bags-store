import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { mediaId, storagePath } = await request.json()

    if (!mediaId) {
      return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 })
    }

    // Delete from storage if path exists
    if (storagePath) {
      await supabase.storage.from('product-media').remove([storagePath])
    }

    // Delete from DB
    const { error } = await supabase
      .from('product_media')
      .delete()
      .eq('id', mediaId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
