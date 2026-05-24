// app/(auth)/layout.tsx
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(155,99,255,0.08) 0%, transparent 55%), var(--bg-base)' }}>
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#9b63ff,#f7931a)', fontFamily: 'var(--font-display)' }}>
          LS
        </div>
        <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Lite<span style={{ color: 'var(--accent-purple)' }}>Social</span>
        </span>
      </Link>
      <div className="w-full max-w-md rounded-2xl p-8"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {children}
      </div>
    </div>
  )
}
