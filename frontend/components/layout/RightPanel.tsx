'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useWalletStore } from '@/store/useWalletStore'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>{children}</div>
}

function timeAgoShort(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return '' }
}

export function RightPanel() {
  const { ltcPrice, change24h, fetchPrice } = useWalletStore()
  const me = useAuthStore((s) => s.user)
  useEffect(() => { fetchPrice() }, [fetchPrice])

  const { data: creatorsData } = useQuery({
    queryKey: ['top-creators'],
    queryFn: () => api.getTopCreators() as Promise<{ creators: any[] }>,
    staleTime: 60_000,
  })

  const { data: newsData, isLoading: newsLoading } = useQuery({
    queryKey: ['crypto-news'],
    queryFn: () => fetch('/api/news').then(r => r.json()) as Promise<{ articles: any[] }>,
    staleTime: 600_000,
    refetchInterval: 600_000,
  })

  // Exclude current user from suggestions
  const creators = (creatorsData?.creators ?? [])
    .filter((c: any) => c.id !== me?.id)
    .slice(0, 4)

  const articles = newsData?.articles ?? []

  return (
    <aside style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-surface)' }} className="hidden xl:flex">

      {/* LTC Price */}
      <div>
        <SectionTitle>Litecoin Price</SectionTitle>
        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--accent-green)' }}>
                {ltcPrice ? `$${ltcPrice.toFixed(2)}` : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading…</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Litecoin · USD · Live</div>
            </div>
            <img src="/ltc-logo.svg" alt="LTC" style={{ width: 38, height: 38 }} />
          </div>
          {change24h !== null && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 8, background: change24h >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: change24h >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {change24h >= 0 ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% today
            </div>
          )}
        </div>
      </div>

      {/* Suggested Creators */}
      {creators.length > 0 && (
        <div>
          <SectionTitle>Suggested Creators</SectionTitle>
          <div style={{ borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {creators.map((c: any, i: number) => (
              <div key={c.id} style={{ borderBottom: i < creators.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <CreatorCard creator={c} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crypto News */}
      <div>
        <SectionTitle>Crypto & Web3 News</SectionTitle>
        <div style={{ borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          {newsLoading && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Loading headlines…</div>
          )}
          {articles.slice(0, 6).map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '12px 14px', borderBottom: i < articles.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', transition: 'background 140ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,93,157,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, marginBottom: 4 }}>{a.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--accent-blue-lt)', fontFamily: 'var(--font-display)' }}>{a.source}</span>
                {a.pubDate && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>· {timeAgoShort(a.pubDate)}</span>}
              </div>
            </a>
          ))}
          {!newsLoading && articles.length === 0 && (
            <div style={{ padding: '16px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No headlines available</div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.9, marginTop: 'auto', paddingTop: 8 }}>
        PrimeDesk · Built on Litecoin<br />
        IPFS · BlockCypher · Pinata<br />
        <span style={{ color: 'var(--accent-blue-lt)' }}>primedesk.xyz</span>
      </div>
    </aside>
  )
}
