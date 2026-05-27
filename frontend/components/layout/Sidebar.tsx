'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { api } from '@/lib/api-client'
import { useEffect } from 'react'

const NAV = [
  { href: '/home',          icon: '🏠', label: 'Home' },
  { href: '/explore',       icon: '🔍', label: 'Explore' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/earnings',      icon: '📈', label: 'Earnings' },
  { href: '/settings',      icon: '⚙️', label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { ltcPrice, change24h, fetchPrice } = useWalletStore()

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 30_000,
  })
  const unreadCount = unreadData?.count ?? 0
  useEffect(() => { fetchPrice() }, [fetchPrice])

  return (
    <aside style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '16px 10px', height: '100vh', overflowY: 'auto', background: 'var(--bg-surface)' }}>
      {/* Logo */}
      <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 20px', textDecoration: 'none' }}>
        <img src="/ltc-logo.svg" alt="PrimeDesk" style={{ width: 30, height: 30 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          Prime<span style={{ color: 'var(--accent-blue-lt)' }}>Desk</span>
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 500, position: 'relative', background: active ? 'rgba(52,93,157,0.18)' : 'transparent', border: `1px solid ${active ? 'rgba(52,93,157,0.4)' : 'transparent'}`, color: active ? 'var(--accent-blue-lt)' : 'var(--text-secondary)', transition: 'all 160ms' }}>
              <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span style={{ position: 'absolute', right: 12, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: 'var(--accent-blue)', color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
        {user && (
          <Link href={`/${user.username}`} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 12, textDecoration: 'none', fontSize: 14, fontWeight: 500, background: pathname === `/${user.username}` ? 'rgba(52,93,157,0.18)' : 'transparent', border: `1px solid ${pathname === `/${user.username}` ? 'rgba(52,93,157,0.4)' : 'transparent'}`, color: pathname === `/${user.username}` ? 'var(--accent-blue-lt)' : 'var(--text-secondary)' }}>
            <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>👤</span>
            Profile
          </Link>
        )}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Sign out */}
      {user && (
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', width: '100%', marginTop: 8 }}>
          <span>↩</span> Sign Out
        </button>
      )}
    </aside>
  )
}
