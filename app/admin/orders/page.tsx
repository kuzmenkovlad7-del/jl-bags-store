'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { formatPrice } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ta } from '@/lib/admin-i18n'

export default function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data)
    }
    setLoading(false)
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      toast({
        title: ta('common.error'),
        description: ta('orders.errorUpdate'),
        variant: 'destructive',
      })
      return
    }

    toast({ title: ta('orders.orderUpdated') })
    loadOrders()
  }

  function orderTypeLabel(type: string): string {
    switch (type) {
      case 'retail': return ta('orders.typeRetail')
      case 'drop': return ta('orders.typeDrop')
      case 'wholesale': return ta('orders.typeWholesale')
      default: return type
    }
  }

  function deliveryLabel(method: string): string {
    switch (method) {
      case 'nova': return 'Нова Пошта'
      case 'ukr': return 'Укрпошта'
      default: return method || ''
    }
  }

  function parseComment(comment: string | null): { branch: string | null; rest: string | null } {
    if (!comment) return { branch: null, rest: null }
    const m = comment.match(/^(?:Відд\.|Отд\.) №([^|]+?)(?:\s*\|\s*(.+))?$/)
    if (m) return { branch: m[1].trim(), rest: m[2]?.trim() || null }
    return { branch: null, rest: comment }
  }

  if (loading) {
    return <div>{ta('orders.loading')}</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{ta('orders.title')}</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.orderNumber')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.customer')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.type')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.items')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 text-sm font-mono text-xs">
                  {order.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium">{order.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{order.phone}</div>
                  {order.telegram && (
                    <div className="text-xs text-muted-foreground">{order.telegram}</div>
                  )}
                  {(order.delivery_method || order.city) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[deliveryLabel(order.delivery_method), order.city].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {(() => {
                    const { branch, rest } = parseComment(order.comment ?? null)
                    return (
                      <>
                        {branch && (
                          <div className="text-xs text-muted-foreground">Відд. №{branch}</div>
                        )}
                        {rest && (
                          <div className="text-xs text-gray-400 italic">{rest}</div>
                        )}
                      </>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {orderTypeLabel(order.order_type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {order.items?.map((item, i) => (
                    <div key={i} className="text-xs">
                      {item.product_code} ({item.color}) x{item.qty} -{' '}
                      {formatPrice(item.price_snapshot)}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Select
                    value={order.status}
                    onValueChange={(value: OrderStatus) =>
                      updateStatus(order.id, value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{ta('orders.statusNew')}</SelectItem>
                      <SelectItem value="confirmed">{ta('orders.statusConfirmed')}</SelectItem>
                      <SelectItem value="packed">{ta('orders.statusPacked')}</SelectItem>
                      <SelectItem value="shipped">{ta('orders.statusShipped')}</SelectItem>
                      <SelectItem value="completed">{ta('orders.statusCompleted')}</SelectItem>
                      <SelectItem value="canceled">{ta('orders.statusCanceled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {ta('orders.noOrders')}
        </div>
      )}
    </div>
  )
}
