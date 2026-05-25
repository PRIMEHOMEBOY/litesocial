'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useWalletStore } from '@/store/useWalletStore'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { useEffect } from 'react'
import Link from 'next/link'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>
      {children}
    </div>
  )
}

export function RightPanel() {
  const { ltcPrice, change24h, fetchPrice } = useWalletStore()
  useEffect(() => { fetchPrice() }, [fetchPrice])

  const { data: tagsData } = useQuery({
    queryKey: ['trending-tags'],
    queryFn: () => api.getTrendingTags() as Promise<{ tags: { name: string; count: number }[] }>,
    staleTime: 60_000,
  })

  const { data: creatorsData } = useQuery({
    queryKey: ['top-creators'],
    queryFn: () => api.getTopCreators() as Promise<{ creators: any[] }>,
    staleTime: 60_000,
  })

  const tags = tagsData?.tags?.slice(0, 6) ?? []
  const creators = creatorsData?.creators?.slice(0, 4) ?? []

  return (
    <aside style={{
      width: 300, flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      overflowY: 'auto', padding: '16px 14px',
      display: 'flex', flexDirection: 'column', gap: 20,
      background: 'var(--bg-surface)',
    }} className="hidden xl:flex">

      {/* LTC Price card */}
      <div>
        <SectionTitle>Litecoin Price</SectionTitle>
        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--accent-green)' }}>
                ${ltcPrice?.toFixed(2) ?? '—'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Litecoin · USD</div>
            </div>
            <div style={{ fontSize: 28 }}>Ł</div>
          </div>
          {change24h !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 8,
              background: change24h >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
              color: change24h >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {change24h >= 0 ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% today
            </div>
          )}
        </div>
      </div>

      {/* Trending tags */}
      {tags.length > 0 && (
        <div>
          <SectionTitle>Trending</SectionTitle>
          <div style={{ borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {tags.map((t, i) => (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', cursor: 'pointer', transition: 'background 140ms',
                borderBottom: i < tags.length - 1 ? '1px solid var(--border)' : 'none',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,93,157,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-cyan)' }}>#{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'var(--font-display)' }}>{t.count} posts</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Who to follow */}
      {creators.length > 0 && (
        <div>
          <SectionTitle>Suggested Creators</SectionTitle>
          <div style={{ borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            {creators.map((c, i) => (
              <div key={c.id} style={{ borderBottom: i < creators.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <CreatorCard creator={c} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network stats */}
      <div>
        <SectionTitle>Network</SectionTitle>
        <div style={{ borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Block Time', value: '~2.5 min' },
            { label: 'Tx Fee', value: '< $0.01' },
            { label: 'Confirmations', value: '3 required' },
            { label: 'Platform Fee', value: '0%' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-display)', color: 'var(--accent-green)', fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.9, marginTop: 'auto', paddingTop: 8 }}>
        LiteSocial · Built on Litecoin<br />
        IPFS · BlockCypher · Pinata<br />
        <span style={{ color: 'var(--accent-blue-lt)' }}>litesocial.xyz</span>
      </div>
    </aside>
  )
}
