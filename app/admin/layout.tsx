'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Package, Settings, ShoppingCart, LogOut, Upload } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { ta } from '@/lib/admin-i18n'

const NAV_LINKS = [
  { href: '/admin/products', icon: Package,     label: 'Товары' },
  { href: '/admin/orders',   icon: ShoppingCart, label: 'Заказы' },
  { href: '/admin/settings', icon: Settings,     label: 'Настройки' },
  { href: '/admin/import',   icon: Upload,       label: 'Импорт' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser]       = useState<any>(null)

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user && pathname !== '/admin/login') router.push('/admin/login')
    else setUser(user)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{ta('common.loading')}</div>
  }

  if (pathname === '/admin/login') return children
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14">
          {/* Brand + nav links */}
          <div className="flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-hide">
            <Link
              href="/admin/products"
              className="font-bold text-base shrink-0 mr-2 hidden sm:block"
            >
              JL Admin
            </Link>
            <span className="font-bold text-sm shrink-0 mr-1 sm:hidden text-primary">JL</span>

            {NAV_LINKS.map(({ href, icon: Icon, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors shrink-0',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 text-gray-700',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="shrink-0 ml-2 h-9 px-2 sm:px-3"
            title={ta('nav.logout')}
          >
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline text-sm">{ta('nav.logout')}</span>
          </Button>
        </div>
      </nav>

      <main className="container py-4 sm:py-8">{children}</main>
      <Toaster />
    </div>
  )
}
