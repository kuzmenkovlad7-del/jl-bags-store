import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      order_type,
      customer_name,
      phone,
      telegram,
      city,
      delivery_method,
      comment,
      items,
    } = body

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_type,
        customer_name,
        phone,
        telegram: telegram || null,
        city: city || null,
        delivery_method,
        comment: comment || null,
        status: 'new',
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error('Failed to create order')
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_code: item.product_code,
      color: item.color,
      qty: item.qty,
      price_snapshot: item.price_snapshot,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      throw new Error('Failed to create order items')
    }

    // Send webhook
    const webhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      'https://n8n.vladkuzmenko.com/webhook/jl-website'

    let webhookStatus = 'pending'
    let webhookError = null

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          order_type,
          customer_name,
          phone,
          telegram,
          city,
          delivery_method,
          comment,
          items,
          created_at: order.created_at,
        }),
      })

      webhookStatus = webhookResponse.ok ? 'success' : 'failed'
      if (!webhookResponse.ok) {
        webhookError = `HTTP ${webhookResponse.status}`
      }
    } catch (error: any) {
      webhookStatus = 'failed'
      webhookError = error.message
    }

    // Update order with webhook status
    await supabase
      .from('orders')
      .update({
        webhook_status: webhookStatus,
        webhook_error: webhookError,
      })
      .eq('id', order.id)

    return NextResponse.json({ success: true, order_id: order.id })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}
