import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(52,93,157,0.14) 0%, transparent 60%), #060a10',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, textDecoration: 'none' }}>
        <img src="/pd-logo.svg" alt="PrimeDesk" style={{ width: 38, height: 38, borderRadius: 10 }} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>
          Prime<span style={{ color: 'var(--accent-blue-lt)' }}>Desk</span>
        </span>
      </Link>
      <div style={{
        width: '100%', maxWidth: 440, borderRadius: 20, padding: '28px 28px',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {children}
      </div>
    </div>
  )
}
