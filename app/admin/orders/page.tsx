'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { formatPrice } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Order status updated' })
    loadOrders()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Items</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Webhook</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
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
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
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
          No orders yet
        </div>
      )}
    </div>
  )
}
