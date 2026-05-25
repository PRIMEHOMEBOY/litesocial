import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(52,93,157,0.12) 0%, transparent 60%), var(--bg-base)',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #345D9D, #4a80d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          fontFamily: 'var(--font-display)',
          boxShadow: '0 0 20px rgba(52,93,157,0.4)',
        }}>LS</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>
          Lite<span style={{ color: 'var(--accent-blue-lt)' }}>Social</span>
        </span>
      </Link>
      <div style={{
        width: '100%', maxWidth: 440, borderRadius: 20, padding: '28px 28px',
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
      }}>
        {children}
      </div>
    </div>
  )
}
