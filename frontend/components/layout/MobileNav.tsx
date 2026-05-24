'use client'
// components/layout/MobileNav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

const NAV = [
  { href: '/home', icon: '🏠', label: 'Home' },
  { href: '/explore', icon: '🔍', label: 'Explore' },
  { href: '/notifications', icon: '🔔', label: 'Alerts' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

export function MobileNav() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 30_000,
  })
  const unreadCount = unreadData?.count ?? 0

  const allNav = user ? [...NAV, { href: `/${user.username}`, icon: '👤', label: 'Profile' }] : NAV

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex xl:hidden"
      style={{
        background: 'rgba(8,8,8,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div className="flex w-full">
        {allNav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors relative"
              style={{ color: active ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
              <span className="text-xl">{item.icon}</span>
              {item.label}
              {item.label === 'Alerts' && unreadCount > 0 && (
                <span className="absolute top-2 right-1/4 w-4 h-4 text-[10px] rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent-purple)', color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
