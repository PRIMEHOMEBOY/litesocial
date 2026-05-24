'use client'
// app/(app)/layout.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { RightPanel } from '@/components/layout/RightPanel'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !user) router.replace('/login')
  }, [user, isHydrated, router])

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent-purple)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
        {children}
      </main>
      <RightPanel />
      <MobileNav />
    </div>
  )
}
