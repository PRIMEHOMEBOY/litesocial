'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { api } from '@/lib/api-client'
import { Avatar } from '@/components/ui/Avatar'
import { getIpfsUrl } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function TopBar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { ltcPrice, fetchPrice } = useWalletStore()
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => { fetchPrice() }, [fetchPrice])

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 30_000,
  })
  const unreadCount = unreadData?.count ?? 0
  const avatarUrl = getIpfsUrl((user as any)?.avatarIpfsHash)

  const NAV = [
    { href: '/home',          icon: '🏠', label: 'Home' },
    { href: '/explore',       icon: '🔍', label: 'Explore' },
    { href: '/notifications', icon: '🔔', label: 'Notifications' },
    { href: '/earnings',      icon: '📈', label: 'Earnings' },
    { href: '/settings',      icon: '⚙️', label: 'Settings' },
    { href: user ? `/${user.username}` : '/home', icon: '👤', label: 'Profile' },
  ]

  return (
    <>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56, borderBottom: '1px solid var(--border)',
        background: 'rgba(6,10,16,0.97)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
      }}>
        {/* App logo + name only — no nav links */}
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <img src="/pd-logo.svg" alt="PrimeDesk" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Prime<span style={{ color: 'var(--accent-blue-lt)' }}>Desk</span>
          </span>
        </Link>

        {/* Right: LTC price + notification bell + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Live LTC price chip */}
          {ltcPrice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <img src="/ltc-logo.svg" alt="LTC" style={{ width: 16, height: 16 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>
                ${ltcPrice.toFixed(2)}
              </span>
            </div>
          )}

          {/* Notification bell */}
          <Link href="/notifications" style={{ position: 'relative', textDecoration: 'none', fontSize: 20, lineHeight: 1 }}>
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -6,
                width: 16, height: 16, fontSize: 9, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--accent-blue)', color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 700,
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar — opens dropdown */}
          <div onClick={() => setMenuOpen(o => !o)} style={{ cursor: 'pointer', position: 'relative' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
            ) : (
              <Avatar name={user?.displayName || user?.username || '?'} size={34} />
            )}
          </div>
        </div>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 38 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'fixed', top: 60, right: 16, zIndex: 39, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, minWidth: 200, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            {/* User info */}
            {user && (
              <Link href={`/${user.username}`} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', textDecoration: 'none', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                  : <Avatar name={user.displayName || user.username} size={38} />}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{user.displayName || user.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user.username}</div>
                </div>
              </Link>
            )}

            {/* Nav items */}
            {NAV.map(item => {
              const active = item.href !== '/home' ? pathname.startsWith(item.href) : pathname === '/home'
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', fontSize: 14, fontWeight: 500, color: active ? 'var(--accent-blue-lt)' : 'var(--text-secondary)', borderBottom: '1px solid var(--border)', transition: 'background 140ms', background: active ? 'rgba(52,93,157,0.08)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = active ? 'rgba(52,93,157,0.08)' : 'transparent')}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--accent-blue)', color: '#fff', fontFamily: 'var(--font-display)' }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}

            <button onClick={() => { logout(); setMenuOpen(false) }}
              style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: 14, color: 'var(--accent-red)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span>↩</span> Sign Out
            </button>
          </div>
        </>
      )}
    </>
  )
}
