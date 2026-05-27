'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { MobileNav } from '@/components/layout/MobileNav'
import { RightPanel } from '@/components/layout/RightPanel'
import { TopBar } from '@/components/layout/TopBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !user) router.replace('/login')
  }, [user, isHydrated, router])

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--accent-blue)', borderTopColor: 'transparent', animation: 'spin 700ms linear infinite' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      {/* Top bar with logo + nav (replaces sidebar on all screens) */}
      <TopBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main content — full width (no sidebar) */}
        <main style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 80 }}>
            {children}
          </div>
        </main>

        {/* Right panel — desktop only */}
        <RightPanel />
      </div>

      <MobileNav />
    </div>
  )
}
