import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { mediaId, productId } = await request.json()

    if (!mediaId || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Reset all primary flags for this product
    await supabase
      .from('product_media')
      .update({ is_primary: false })
      .eq('product_id', productId)

    // Set new primary
    const { error } = await supabase
      .from('product_media')
      .update({ is_primary: true })
      .eq('id', mediaId)

    if (error) {
      console.error('Set primary error:', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set primary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
