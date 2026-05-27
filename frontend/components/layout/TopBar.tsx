'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { api } from '@/lib/api-client'
import { Avatar } from '@/components/ui/Avatar'
import { getIpfsUrl } from '@/lib/utils'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/home',          icon: '🏠', label: 'Home' },
  { href: '/explore',       icon: '🔍', label: 'Explore' },
  { href: '/notifications', icon: '🔔', label: 'Notifications' },
  { href: '/earnings',      icon: '📈', label: 'Earnings' },
  { href: '/settings',      icon: '⚙️', label: 'Settings' },
]

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { ltcPrice, fetchPrice } = useWalletStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 30_000,
  })
  const unreadCount = unreadData?.count ?? 0

  useEffect(() => { fetchPrice() }, [fetchPrice])

  const avatarUrl = getIpfsUrl((user as any)?.avatarIpfsHash)

  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 56, borderBottom: '1px solid var(--border)', background: 'rgba(6,10,16,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0 }}>

        {/* Logo */}
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/ltc-logo.svg" alt="PrimeDesk" style={{ width: 28, height: 28 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Prime<span style={{ color: 'var(--accent-blue-lt)' }}>Desk</span>
          </span>
        </Link>

        {/* Desktop Nav — centered */}
        <nav style={{ display: 'flex', gap: 4, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} className="hidden md:flex">
          {NAV.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 500, position: 'relative', background: active ? 'rgba(52,93,157,0.18)' : 'transparent', border: `1px solid ${active ? 'rgba(52,93,157,0.35)' : 'transparent'}`, color: active ? 'var(--accent-blue-lt)' : 'var(--text-secondary)', transition: 'all 150ms', whiteSpace: 'nowrap' }}>
                <span>{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, fontSize: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-blue)', color: '#fff', fontFamily: 'var(--font-display)' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
          {user && (
            <Link href={`/${user.username}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 500, background: pathname === `/${user.username}` ? 'rgba(52,93,157,0.18)' : 'transparent', border: `1px solid ${pathname === `/${user.username}` ? 'rgba(52,93,157,0.35)' : 'transparent'}`, color: pathname === `/${user.username}` ? 'var(--accent-blue-lt)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              <span>👤</span>
              <span className="hidden lg:inline">Profile</span>
            </Link>
          )}
        </nav>

        {/* Right side: LTC price + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {ltcPrice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} className="hidden sm:flex">
              <img src="/ltc-logo.svg" alt="LTC" style={{ width: 16, height: 16 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>${ltcPrice.toFixed(2)}</span>
            </div>
          )}

          {/* Avatar / menu toggle */}
          <div onClick={() => setMenuOpen(o => !o)} style={{ cursor: 'pointer', position: 'relative' }}>
            <Avatar name={user?.displayName || user?.username || '?'} src={avatarUrl} size={32} />
          </div>
        </div>
      </header>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 38 }} onClick={() => setMenuOpen(false)} />
          <div style={{ position: 'fixed', top: 60, right: 16, zIndex: 39, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, minWidth: 180, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {user && (
              <Link href={`/${user.username}`} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <Avatar name={user.displayName || user.username} src={avatarUrl} size={32} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{user.displayName || user.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{user.username}</div>
                </div>
              </Link>
            )}
            {NAV.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', textDecoration: 'none', fontSize: 14, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', transition: 'background 140ms' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span>{item.icon}</span>{item.label}
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--accent-blue)', color: '#fff', fontFamily: 'var(--font-display)' }}>{unreadCount}</span>
                )}
              </Link>
            ))}
            <button onClick={() => { logout(); setMenuOpen(false) }}
              style={{ width: '100%', padding: '11px 16px', textAlign: 'left', fontSize: 14, color: 'var(--accent-red)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              ↩ Sign Out
            </button>
          </div>
        </>
      )}
    </>
  )
}
