'use client'
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
    <aside style={{
      width: 240,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 10px',
      height: '100vh',
      overflowY: 'auto',
      background: 'var(--bg-surface)',
    }}>
      {/* Logo — full name */}
      <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px 20px', textDecoration: 'none' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #345D9D, #4a80d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          fontFamily: 'var(--font-display)', flexShrink: 0,
          boxShadow: '0 0 16px rgba(52,93,157,0.4)',
        }}>LS</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          Lite<span style={{ color: 'var(--accent-blue-lt)' }}>Social</span>
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
                fontSize: 14, fontWeight: 500, position: 'relative',
                background: active ? 'rgba(52,93,157,0.18)' : 'transparent',
                border: `1px solid ${active ? 'rgba(52,93,157,0.4)' : 'transparent'}`,
                color: active ? 'var(--accent-blue-lt)' : 'var(--text-secondary)',
                transition: 'all 160ms',
              }}>
              <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span style={{
                  position: 'absolute', right: 12,
                  fontSize: 10, fontWeight: 700, padding: '2px 6px',
                  borderRadius: 20, background: 'var(--accent-blue)',
                  color: '#fff', fontFamily: 'var(--font-display)',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
        {user && (
          <Link href={`/${user.username}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '10px 12px', borderRadius: 12, textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
              background: pathname === `/${user.username}` ? 'rgba(52,93,157,0.18)' : 'transparent',
              border: `1px solid ${pathname === `/${user.username}` ? 'rgba(52,93,157,0.4)' : 'transparent'}`,
              color: pathname === `/${user.username}` ? 'var(--accent-blue-lt)' : 'var(--text-secondary)',
            }}>
            <span style={{ fontSize: 17, width: 22, textAlign: 'center' }}>👤</span>
            Profile
          </Link>
        )}
      </nav>

      <div style={{ flex: 1 }} />

      {/* LTC Price */}
      {ltcPrice !== null && (
        <div style={{
          margin: '0 2px 10px', padding: '10px 12px', borderRadius: 12,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>LTC / USD</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--accent-green)' }}>
              ${ltcPrice.toFixed(2)}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 6,
              background: (change24h ?? 0) >= 0 ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
              color: (change24h ?? 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {(change24h ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(change24h ?? 0).toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* User card */}
      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 12,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        }}>
          <Avatar name={user.displayName || user.username} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.displayName || user.username}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.ltcAddress ? truncateAddress(user.ltcAddress) : user.email}
            </div>
          </div>
          <button onClick={logout} title="Sign out"
            style={{ fontSize: 14, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            ↩
          </button>
        </div>
      )}
    </aside>
  )
}
