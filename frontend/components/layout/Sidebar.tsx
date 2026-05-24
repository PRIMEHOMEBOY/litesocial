'use client'
// components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { api } from '@/lib/api-client'
import { truncateAddress } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { useEffect } from 'react'

const NAV = [
  { href: '/home', icon: '🏠', label: 'Home' },
  { href: '/explore', icon: '🔍', label: 'Explore' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/earnings', icon: '📈', label: 'Earnings' },
  { href: '/settings', icon: '⚙️', label: 'Settings' },
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
    <aside style={{
      width: 260,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
      height: '100vh',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-3 px-3 pb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#9b63ff,#f7931a)', fontFamily: 'var(--font-display)' }}>
          LS
        </div>
        <span className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Lite<span style={{ color: 'var(--accent-purple)' }}>Social</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative"
              style={{
                background: active ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute right-3 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-purple)', color: '#fff', fontFamily: 'var(--font-display)' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
        {user && (
          <Link href={`/${user.username}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: pathname === `/${user.username}` ? 'var(--bg-elevated)' : 'transparent',
              border: `1px solid ${pathname === `/${user.username}` ? 'var(--border)' : 'transparent'}`,
              color: pathname === `/${user.username}` ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}>
            <span className="text-base w-5 text-center">👤</span>
            Profile
          </Link>
        )}
      </nav>

      <div style={{ flex: 1 }} />

      {/* LTC Price chip */}
      {ltcPrice !== null && (
        <div className="px-3 py-2 mb-3 rounded-xl text-xs flex items-center justify-between"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'var(--font-display)' }}>
          <span style={{ color: 'var(--text-muted)' }}>LTC/USD</span>
          <span style={{ color: 'var(--accent-green)' }}>${ltcPrice.toFixed(2)}</span>
          <span style={{ color: (change24h ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 10 }}>
            {(change24h ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(change24h ?? 0).toFixed(2)}%
          </span>
        </div>
      )}

      {/* User card */}
      {user && (
        <div className="px-3 py-3 rounded-xl flex items-center gap-3"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <Avatar name={user.displayName || user.username} size={36} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user.displayName || user.username}</div>
            <div className="text-xs truncate" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              {user.ltcAddress ? truncateAddress(user.ltcAddress) : user.email}
            </div>
          </div>
          <button onClick={logout} title="Sign out" className="text-xs p-1" style={{ color: 'var(--text-muted)' }}>↩</button>
        </div>
      )}
    </aside>
  )
}
