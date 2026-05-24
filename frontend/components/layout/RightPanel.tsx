'use client'
// components/layout/RightPanel.tsx
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useWalletStore } from '@/store/useWalletStore'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { useEffect } from 'react'

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

  const tags = tagsData?.tags?.slice(0, 5) ?? []
  const creators = creatorsData?.creators?.slice(0, 4) ?? []

  return (
    <aside style={{
      width: 300,
      flexShrink: 0,
      borderLeft: '1px solid var(--border)',
      overflowY: 'auto',
      padding: '20px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}
      className="hidden xl:flex">

      {/* LTC Price */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>LTC Price</div>
        <div className="p-4 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>
            ${ltcPrice?.toFixed(2) ?? '—'}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Litecoin · USD</div>
          {change24h !== null && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-lg text-xs font-semibold"
              style={{ background: (change24h >= 0 ? 'rgba(126,232,162,0.12)' : 'rgba(255,107,157,0.12)'), color: (change24h >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') }}>
              {change24h >= 0 ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% today
            </div>
          )}
        </div>
      </div>

      {/* Trending */}
      {tags.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Trending</div>
          <div className="flex flex-col">
            {tags.map((t) => (
              <div key={t.name} className="flex items-center justify-between py-2.5 px-2 rounded-xl cursor-pointer transition-all hover:bg-elevated"
                style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--accent-purple)' }}>#{t.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{t.count} posts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Creators */}
      {creators.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Suggested Creators</div>
          <div className="flex flex-col gap-1">
            {creators.map((c) => <CreatorCard key={c.id} creator={c} compact />)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.9 }}>
        LiteSocial · 0% fee · Built on Litecoin<br />
        IPFS storage via Pinata · BlockCypher<br />
        <span style={{ color: 'var(--accent-purple)' }}>litesocial.xyz</span>
      </div>
    </aside>
  )
}
