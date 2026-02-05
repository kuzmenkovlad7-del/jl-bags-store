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
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.phone')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.type')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.items')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.status')}</th>
              <th className="px-4 py-3 text-left text-sm font-medium">{ta('orders.webhook')}</th>
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
                  <div>{order.customer_name}</div>
                  {order.city && (
                    <div className="text-xs text-muted-foreground">{order.city}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>{order.phone}</div>
                  {order.telegram && (
                    <div className="text-xs text-muted-foreground">
                      {order.telegram}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {order.order_type}
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
                  <span
                    className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      order.webhook_status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : order.webhook_status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.webhook_status || 'pending'}
                  </span>
                  {order.webhook_error && (
                    <div className="text-xs text-red-600 mt-1">
                      {order.webhook_error}
                    </div>
                  )}
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
