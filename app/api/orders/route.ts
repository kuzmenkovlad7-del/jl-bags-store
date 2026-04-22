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
      // Source attribution (optional — added by client from sessionStorage)
      utm_source,
      utm_medium,
      utm_campaign,
      referrer_url,
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
        // Attribution fields (columns added in migration 005)
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        referrer_url: referrer_url || null,
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

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      throw new Error('Failed to create order items')
    }

    // Send webhook — non-blocking, failure does not prevent order creation
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    let webhookStatus = 'pending'
    let webhookError = null

    if (webhookUrl) {
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
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            created_at: order.created_at,
          }),
        })

        webhookStatus = webhookResponse.ok ? 'success' : 'failed'
        if (!webhookResponse.ok) {
          webhookError = `HTTP ${webhookResponse.status}`
        }
      } catch (err: any) {
        webhookStatus = 'failed'
        webhookError = err.message
      }
    } else {
      // No webhook configured — mark as skipped rather than failed
      webhookStatus = 'skipped'
    }

    // Update order with webhook outcome
    await supabase
      .from('orders')
      .update({ webhook_status: webhookStatus, webhook_error: webhookError })
      .eq('id', order.id)

    return NextResponse.json({ success: true, order_id: order.id })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 },
    )
  }
}
