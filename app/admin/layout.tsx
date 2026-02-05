'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Package, ShoppingCart, LogOut } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { ta } from '@/lib/admin-i18n'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && pathname !== '/admin/login') {
      router.push('/admin/login')
    } else {
      setUser(user)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{ta('common.loading')}</div>
  }

  if (pathname === '/admin/login') {
    return children
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/admin/products" className="font-bold text-lg">
              {ta('nav.title')}
            </Link>
            <div className="flex gap-4">
              <Link
                href="/admin/products"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin/products'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                <Package className="h-4 w-4" />
                {ta('nav.products')}
              </Link>
              <Link
                href="/admin/orders"
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin/orders'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                {ta('nav.orders')}
              </Link>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            {ta('nav.logout')}
          </Button>
        </div>
      </nav>
      <main className="container py-8">{children}</main>
      <Toaster />
    </div>
  )
}
