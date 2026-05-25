'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

const NAV = [
  { href: '/home',          icon: '🏠', label: 'Home' },
  { href: '/explore',       icon: '🔍', label: 'Explore' },
  { href: '/notifications', icon: '🔔', label: 'Alerts' },
  { href: '/earnings',      icon: '📈', label: 'Earn' },
  { href: '/settings',      icon: '⚙️', label: 'Settings' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex xl:hidden"
      style={{
        background: 'rgba(6,10,16,0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div style={{ display: 'flex', width: '100%' }}>
        {allNav.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, padding: '10px 4px',
                fontSize: 10, fontWeight: 600, textDecoration: 'none',
                color: active ? 'var(--accent-blue-lt)' : 'var(--text-muted)',
                position: 'relative', transition: 'color 160ms',
              }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
              {item.label === 'Alerts' && unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 8, right: '28%',
                  width: 16, height: 16, fontSize: 9, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--accent-blue)', color: '#fff', fontFamily: 'var(--font-display)',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {active && (
                <span style={{
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 2, borderRadius: 2, background: 'var(--accent-blue-lt)',
                }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
