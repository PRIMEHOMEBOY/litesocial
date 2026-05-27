'use client'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

/* ── tiny star-field canvas ── */
function Stars() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      o: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.0004 + 0.0001,
      phase: Math.random() * Math.PI * 2,
    }))
    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach(s => {
        const alpha = s.o * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.phase))
        ctx.beginPath()
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.fill()
      })
      // scattered coloured dots
      const dots = [
        { x: 0.12, y: 0.3, c: 'rgba(52,93,157,0.5)', r: 2 },
        { x: 0.88, y: 0.15, c: 'rgba(247,147,26,0.5)', r: 2 },
        { x: 0.05, y: 0.65, c: 'rgba(247,147,26,0.4)', r: 1.5 },
        { x: 0.95, y: 0.55, c: 'rgba(52,93,157,0.4)', r: 1.5 },
        { x: 0.4, y: 0.08, c: 'rgba(74,222,128,0.3)', r: 1.5 },
        { x: 0.6, y: 0.92, c: 'rgba(56,189,248,0.3)', r: 1.5 },
      ]
      dots.forEach(d => {
        ctx.beginPath()
        ctx.arc(d.x * canvas.width, d.y * canvas.height, d.r, 0, Math.PI * 2)
        ctx.fillStyle = d.c; ctx.fill()
      })
      t++; raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />
}

const S: Record<string, React.CSSProperties> = {
  page: { background: '#08090f', color: '#f0f4ff', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh', overflowX: 'hidden', position: 'relative' },
  wrap: { position: 'relative', zIndex: 1 },
  mono: { fontFamily: "'Space Mono', monospace" },
}

function Dot({ color = '#4ade80' }: { color?: string }) {
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 8, boxShadow: `0 0 8px ${color}` }} />
}

export default function LandingPage() {
  const { user, isHydrated } = useAuthStore()
  const router = useRouter()
  useEffect(() => { if (isHydrated && user) router.replace('/home') }, [user, isHydrated, router])

  return (
    <div style={S.page}>
      <Stars />
      <div style={S.wrap}>

        {/* ── NAV ── */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,9,15,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#345D9D,#4a80d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', ...S.mono }}>LS</div>
            <span style={{ fontWeight: 700, fontSize: 16, ...S.mono }}>PrimeDesk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Built on Litecoin</span>
            <Link href="/connect-wallet" style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#345D9D,#4a80d4)', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none', boxShadow: '0 0 20px rgba(52,93,157,0.4)' }}>
              Connect Wallet
            </Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ textAlign: 'center', padding: '72px 20px 56px', maxWidth: 780, margin: '0 auto' }}>
          {/* Live badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: 30, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 36, ...S.mono }}>
            <Dot color="#4ade80" />Now live on Litecoin mainnet
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(42px, 10vw, 76px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 24, ...S.mono }}>
            <span style={{ color: '#fff' }}>Social Media</span><br />
            <span style={{ background: 'linear-gradient(90deg, #6b7fe8, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Without the</span><br />
            <span style={{ background: 'linear-gradient(90deg, #4ade80, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Middleman</span>
          </h1>

          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 36px' }}>
            The first decentralized creator economy platform built on Litecoin. Authenticate with your wallet. Store content on IPFS. Get paid directly in LTC. <strong style={{ color: '#fff' }}>Zero platform fees.</strong>
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/connect-wallet" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#345D9D,#4a80d4)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 0 32px rgba(52,93,157,0.45)' }}>
              ⚡ Connect Wallet & Start →
            </Link>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
              🌐 Sign Up with Email
            </Link>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', maxWidth: 780, margin: '0 auto 80px', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { icon: '👥', num: '2,847',  label: 'Creators' },
            { icon: '⚡', num: '14,293', label: 'LTC Earned' },
            { icon: '📝', num: '89,421', label: 'Posts' },
            { icon: '$',  num: '0%',     label: 'Platform Fee' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '24px 12px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', ...S.mono }}>{s.num}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── BUILT DIFFERENT ── */}
        <section style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px,6vw,44px)', fontWeight: 700, marginBottom: 14, ...S.mono }}>Built Different</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>Every design decision prioritizes decentralization, privacy, and creator ownership.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {[
              { icon: '🌐', color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  title: 'IPFS Content Storage',     desc: 'Every post lives on IPFS — the decentralized web. Censorship-resistant, permanent, and verifiable.' },
              { icon: '⚡', color: '#f7931a', bg: 'rgba(247,147,26,0.15)',  title: 'Instant LTC Payments',     desc: 'Subscriptions and tips are real Litecoin transactions. 2.5-minute blocks, $0.01 fees, no intermediaries.' },
              { icon: '🔒', color: '#f87171', bg: 'rgba(248,113,113,0.15)', title: 'Premium Content',           desc: 'Gate your best content behind LTC subscriptions. Subscribers get instant access when payment confirms on-chain.' },
              { icon: '📈', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', title: 'Creator Economy',           desc: 'Keep 100% of what you earn. No platform cut. Direct P2P payments from fans to creators.' },
              { icon: '⭐', color: '#4ade80', bg: 'rgba(74,222,128,0.15)',  title: 'MWEB Privacy',              desc: 'Optional MimbleWimble privacy for subscribers who want confidential transactions. Coming in Phase 2.' },
            ].map((f) => (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px 22px', transition: 'border-color 200ms' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(52,93,157,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
                  {f.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#fff', ...S.mono }}>{f.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: '64px 20px 80px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px,6vw,44px)', fontWeight: 700, marginBottom: 12, ...S.mono }}>How It Works</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 56 }}>No accounts. No passwords. Just your Litecoin wallet.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 32 }}>
            {[
              { num: '01', color: '#6b7fe8', title: 'Connect Wallet',  desc: 'Enter your Litecoin address. Sign a nonce message with your private key to prove ownership.' },
              { num: '02', color: '#f7931a', title: 'Create & Share',  desc: 'Post content publicly or gate it behind LTC subscriptions. Content is stored on IPFS permanently.' },
              { num: '03', color: '#4ade80', title: 'Earn LTC',        desc: 'Subscribers pay you directly in LTC. Tips go straight to your wallet. 0% platform fee.' },
            ].map((s) => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: s.color, opacity: 0.8, marginBottom: 12, ...S.mono }}>{s.num}</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10, ...S.mono }}>{s.title}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CREATOR STORIES ── */}
        <section style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,6vw,44px)', fontWeight: 700, textAlign: 'center', marginBottom: 48, ...S.mono }}>Creator Stories</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {[
              { quote: '"Finally a social platform that respects my privacy and pays me directly. No middlemen, no censorship."', handle: '@satoshi_lite', earned: '+42.5' },
              { quote: '"My subscribers pay me directly in LTC. I\'ve earned more in 3 months here than 2 years on other platforms."', handle: '@ltc_maxi', earned: '+18.75' },
              { quote: '"The IPFS integration means my art is truly mine. No platform can delete it or take it away."', handle: '@cryptoart_studio', earned: '+9.25' },
            ].map((t) => (
              <div key={t.handle} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, flex: 1 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#4a80d4', ...S.mono }}>{t.handle}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f7931a', ...S.mono }}>{t.earned} LTC</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ padding: '0 20px 80px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            borderRadius: 24, padding: '60px 32px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(52,93,157,0.25), rgba(107,127,232,0.1), rgba(247,147,26,0.08))',
            border: '1px solid rgba(52,93,157,0.3)',
          }}>
            <h2 style={{ fontSize: 'clamp(28px,6vw,48px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2, ...S.mono }}>
              Own Your Content.<br />Own Your Earnings.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Join thousands of creators building on the most decentralized social platform in crypto.
            </p>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg,#345D9D,#4a80d4)', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 0 40px rgba(52,93,157,0.5)' }}>
              ⚡ Get Started — It's Free
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#345D9D,#4a80d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', ...S.mono }}>LS</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', ...S.mono }}>PrimeDesk — Built on Litecoin</span>
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            <span>0% platform fees</span>
            <span>·</span>
            <span>IPFS content</span>
            <span>·</span>
            <span>LTC payments</span>
          </div>
        </footer>

      </div>
    </div>
  )
}
