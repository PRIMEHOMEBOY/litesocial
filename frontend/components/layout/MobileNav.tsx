'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  HomeIcon, ExploreIcon, NotificationIcon,
  EarningsIcon, SettingsIcon, ProfileIcon,
} from '@/components/ui/Icons'

const ICON_SIZE = 24
const BLUE = '#4a80d4'

const NAV = [
  { href: '/home',          label: 'Home',          Icon: HomeIcon },
  { href: '/explore',       label: 'Explore',       Icon: ExploreIcon },
  { href: '/notifications', label: 'Alerts',        Icon: NotificationIcon },
  { href: '/earnings',      label: 'Earnings',      Icon: EarningsIcon },
  { href: '/settings',      label: 'Settings',      Icon: SettingsIcon },
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

  const allNav = user
    ? [...NAV, { href: `/${user.username}`, label: 'Profile', Icon: ProfileIcon }]
    : NAV

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex xl:hidden"
      style={{
        background: 'rgba(6,10,16,0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      <div style={{ display: 'flex', width: '100%' }}>
        {allNav.map((item) => {
          const active = item.href !== '/home'
            ? pathname.startsWith(item.href)
            : pathname === '/home'
          const color = active ? BLUE : 'var(--text-muted)'

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3, padding: '10px 4px',
                textDecoration: 'none', position: 'relative',
                transition: 'color 160ms',
              }}>
              <div style={{ position: 'relative' }}>
                <item.Icon
                  size={ICON_SIZE}
                  color={color}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.label === 'Alerts' && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -3, right: -5,
                    minWidth: 15, height: 15, fontSize: 8,
                    borderRadius: 8, padding: '0 3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: BLUE, color: '#fff',
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color }}>
                {item.label}
              </span>
              {active && (
                <span style={{
                  position: 'absolute', bottom: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20, height: 2, borderRadius: 2,
                  background: BLUE,
                }} />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
