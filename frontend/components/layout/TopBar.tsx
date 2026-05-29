'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import { api } from '@/lib/api-client'
import { Avatar } from '@/components/ui/Avatar'
import { getIpfsUrl } from '@/lib/utils'
import {
  HomeIcon, ExploreIcon, NotificationIcon,
  EarningsIcon, SettingsIcon, ProfileIcon,
  SunIcon, MoonIcon,
} from '@/components/ui/Icons'
import { useEffect, useState } from 'react'

const ICON_SIZE = 26
const BLUE = '#4a80d4'

const NAV = [
  { href: '/home',          label: 'Home',          Icon: HomeIcon },
  { href: '/explore',       label: 'Explore',       Icon: ExploreIcon },
  { href: '/notifications', label: 'Notifications', Icon: NotificationIcon },
  { href: '/earnings',      label: 'Earnings',      Icon: EarningsIcon },
  { href: '/settings',      label: 'Settings',      Icon: SettingsIcon },
]

export function TopBar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { isDark, toggle: toggleTheme } = useThemeStore()
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => api.getUnreadCount(),
    refetchInterval: 30_000,
  })
  const unreadCount = unreadData?.count ?? 0
  const avatarUrl = getIpfsUrl((user as any)?.avatarIpfsHash)

  const allNav = user
    ? [...NAV, { href: `/${user.username}`, label: 'Profile', Icon: ProfileIcon }]
    : NAV

  return (
    <>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 58,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(6,10,16,0.97)',
        backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
      }}>
        {/* Logo */}
        <Link href="/home" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/pd-logo.svg" alt="PrimeDesk" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Prime<span style={{ color: 'var(--accent-blue-lt)' }}>Desk</span>
          </span>
        </Link>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          {/* Dark/Light mode toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: 38, height: 38, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-secondary)',
              transition: 'all 160ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = BLUE
              e.currentTarget.style.color = BLUE
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            {isDark
              ? <SunIcon size={18} color="currentColor" strokeWidth={2.2} />
              : <MoonIcon size={18} color="currentColor" strokeWidth={2.2} />
            }
          </button>

          {/* Notification bell */}
          <Link href="/notifications" style={{ position: 'relative', textDecoration: 'none', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid var(--border)', color: unreadCount > 0 ? BLUE : 'var(--text-secondary)', transition: 'all 160ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; if (!unreadCount) e.currentTarget.style.color = 'var(--text-secondary)' }}>
            <NotificationIcon size={18} color="currentColor" strokeWidth={unreadCount > 0 ? 2.5 : 2} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                minWidth: 17, height: 17, fontSize: 9, borderRadius: 9, padding: '0 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: BLUE, color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 700,
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar — opens dropdown */}
          <div onClick={() => setMenuOpen(o => !o)}
            style={{ cursor: 'pointer', borderRadius: '50%', border: `2px solid ${menuOpen ? BLUE : 'var(--border)'}`, transition: 'border-color 160ms' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
              : <Avatar name={user?.displayName || user?.username || '?'} size={34} />
            }
          </div>
        </div>
      </header>

      {/* Dropdown */}
      {menuOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 38 }} onClick={() => setMenuOpen(false)} />
          <div style={{
            position: 'fixed', top: 62, right: 16, zIndex: 39,
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 16, minWidth: 210, overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
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

            {/* Nav items with icons */}
            {allNav.map(item => {
              const active = item.href !== '/home'
                ? pathname.startsWith(item.href)
                : pathname === '/home'
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    textDecoration: 'none', fontSize: 14, fontWeight: 500,
                    color: active ? BLUE : 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border)',
                    background: active ? 'rgba(74,128,212,0.08)' : 'transparent',
                    transition: 'background 140ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = active ? 'rgba(74,128,212,0.08)' : 'transparent')}>
                  <item.Icon size={20} color={active ? BLUE : 'currentColor'} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 7px', borderRadius: 10, background: BLUE, color: '#fff', fontFamily: 'var(--font-display)' }}>
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Theme toggle in menu */}
            <button onClick={() => { toggleTheme(); setMenuOpen(false) }}
              style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: 14, color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
              {isDark
                ? <><SunIcon size={20} color="currentColor" strokeWidth={2} /> Light Mode</>
                : <><MoonIcon size={20} color="currentColor" strokeWidth={2} /> Dark Mode</>
              }
            </button>

            <button onClick={() => { logout(); setMenuOpen(false) }}
              style={{ width: '100%', padding: '12px 16px', textAlign: 'left', fontSize: 14, color: 'var(--accent-red)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
              <ProfileIcon size={20} color="currentColor" strokeWidth={2} /> Sign Out
            </button>
          </div>
        </>
      )}
    </>
  )
}
