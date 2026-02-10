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

/** Normalize Ukrainian phone to +380XXXXXXXXX format */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return raw
  if (digits.startsWith('380')) return `+${digits}`
  if (digits.startsWith('0')) return `+38${digits}`
  return `+380${digits}`
}

const EMPTY_FORM = {
  customer_name: '',
  phone: '',
  telegram: '',
  city: '',
  branch: '',
  delivery_method: 'nova',
  comment: '',
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
  const [formData, setFormData] = useState({ ...EMPTY_FORM })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Prepend branch info to comment so admin sees it in the orders table
    const deptLabel = locale === 'ru' ? 'Отд.' : 'Відд.'
    const commentParts: string[] = []
    if (formData.branch.trim()) {
      commentParts.push(`${deptLabel} №${formData.branch.trim()}`)
    }
    if (formData.comment.trim()) {
      commentParts.push(formData.comment.trim())
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: orderType,
          customer_name: formData.customer_name,
          phone: normalizePhone(formData.phone),
          telegram: formData.telegram || null,
          city: formData.city,
          delivery_method: formData.delivery_method,
          comment: commentParts.join(' | ') || null,
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
      setFormData({ ...EMPTY_FORM })
    } catch {
      toast({
        title: locale === 'ru' ? 'Ошибка' : 'Помилка',
        description: locale === 'ru' ? 'Не удалось создать заказ' : 'Не вдалося створити замовлення',
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
          {/* Имя и фамилия / Ім'я та прізвище */}
          <div>
            <Label htmlFor="name">{t(locale, 'order.name')}</Label>
            <Input
              id="name"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            />
          </div>

          {/* Phone with +38 prefix UX */}
          <div>
            <Label htmlFor="phone">{t(locale, 'order.phone')}</Label>
            <Input
              id="phone"
              type="tel"
              required
              placeholder="+38 (0XX) XXX-XX-XX"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Telegram optional */}
          <div>
            <Label htmlFor="telegram">{t(locale, 'order.telegram')}</Label>
            <Input
              id="telegram"
              value={formData.telegram}
              onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
            />
          </div>

          {/* Delivery method — Нова Пошта / Укрпошта only */}
          <div>
            <Label htmlFor="delivery">{t(locale, 'order.delivery')}</Label>
            <Select
              value={formData.delivery_method}
              onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nova">{t(locale, 'order.delivery_nova')}</SelectItem>
                <SelectItem value="ukr">{t(locale, 'order.delivery_ukr')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Город / Місто — required */}
          <div>
            <Label htmlFor="city">{t(locale, 'order.city')}</Label>
            <Input
              id="city"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          {/* Отделение / Відділення — required */}
          <div>
            <Label htmlFor="branch">{t(locale, 'order.department')}</Label>
            <Input
              id="branch"
              required
              placeholder={locale === 'ru' ? 'Номер отделения' : 'Номер відділення'}
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
            />
          </div>

          {/* Comment optional */}
          <div>
            <Label htmlFor="comment">{t(locale, 'order.comment')}</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? (locale === 'ru' ? 'Отправка...' : 'Відправка...')
              : t(locale, 'order.submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
