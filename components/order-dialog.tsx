'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Locale, t } from '@/lib/i18n'
import { OrderType } from '@/lib/types'

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locale: Locale
  orderType: OrderType
  productCode: string
  selectedColor: string
  price: number
}

export function OrderDialog({
  open,
  onOpenChange,
  locale,
  orderType,
  productCode,
  selectedColor,
  price,
}: OrderDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    telegram: '',
    city: '',
    delivery_method: 'nova',
    comment: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: orderType,
          ...formData,
          items: [
            {
              product_code: productCode,
              color: selectedColor,
              qty: 1,
              price_snapshot: price,
            },
          ],
        }),
      })

      if (!response.ok) throw new Error('Order failed')

      toast({
        title: t(locale, 'order.success_title'),
        description: t(locale, 'order.success_desc'),
      })

      onOpenChange(false)
      setFormData({
        customer_name: '',
        phone: '',
        telegram: '',
        city: '',
        delivery_method: 'nova',
        comment: '',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(locale, 'order.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t(locale, 'order.name')}</Label>
            <Input
              id="name"
              required
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="phone">{t(locale, 'order.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="telegram">{t(locale, 'order.telegram')}</Label>
            <Input
              id="telegram"
              value={formData.telegram}
              onChange={(e) =>
                setFormData({ ...formData, telegram: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="city">{t(locale, 'order.city')}</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="delivery">{t(locale, 'order.delivery')}</Label>
            <Select
              value={formData.delivery_method}
              onValueChange={(value) =>
                setFormData({ ...formData, delivery_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nova">
                  {t(locale, 'order.delivery_nova')}
                </SelectItem>
                <SelectItem value="ukr">
                  {t(locale, 'order.delivery_ukr')}
                </SelectItem>
                <SelectItem value="courier">
                  {t(locale, 'order.delivery_courier')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comment">{t(locale, 'order.comment')}</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : t(locale, 'order.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
