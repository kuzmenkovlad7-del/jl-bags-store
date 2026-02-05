'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { Settings } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Settings>({
    brand_name: '',
    phone: '',
    instagram_url: '',
    facebook_url: '',
    telegram_url: '',
    default_locale: 'uk',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (data) {
      setFormData(data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('settings')
        .update(formData)
        .eq('id', 1)

      if (error) throw error

      toast({ title: 'Settings updated' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="brand_name">Brand Name</Label>
            <Input
              id="brand_name"
              value={formData.brand_name}
              onChange={(e) =>
                setFormData({ ...formData, brand_name: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="instagram_url">Instagram URL</Label>
            <Input
              id="instagram_url"
              value={formData.instagram_url}
              onChange={(e) =>
                setFormData({ ...formData, instagram_url: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="facebook_url">Facebook URL</Label>
            <Input
              id="facebook_url"
              value={formData.facebook_url}
              onChange={(e) =>
                setFormData({ ...formData, facebook_url: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="telegram_url">Telegram URL</Label>
            <Input
              id="telegram_url"
              value={formData.telegram_url}
              onChange={(e) =>
                setFormData({ ...formData, telegram_url: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="default_locale">Default Locale</Label>
            <Input
              id="default_locale"
              value={formData.default_locale}
              onChange={(e) =>
                setFormData({ ...formData, default_locale: e.target.value })
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </div>
    </div>
  )
}
