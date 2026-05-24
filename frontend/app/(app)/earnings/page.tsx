'use client'
// app/(app)/earnings/page.tsx  (accessible via /earnings)
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { timeAgo, formatLtc } from '@/lib/utils'
import { useEffect } from 'react'

function StatCard({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="text-2xl font-bold mb-1"
        style={{ fontFamily: mono ? 'var(--font-display)' : undefined, color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

export default function EarningsPage() {
  const user = useAuthStore((s) => s.user)
  const { ltcPrice, fetchPrice } = useWalletStore()
  useEffect(() => { fetchPrice() }, [fetchPrice])

  const { data, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => api.getEarnings() as Promise<any>,
  })

  if (user?.creatorTier === 'NONE') {
    return (
      <>
        <PageHeader title="Earnings" />
        <div className="text-center py-20 px-8">
          <div className="text-5xl mb-4">📈</div>
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Become a Creator</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Set up your creator tier and subscription price in Settings to start earning LTC directly from your audience.
          </p>
          <a href="/settings" className="ls-btn-primary inline-flex" style={{ maxWidth: 220 }}>
            Go to Settings →
          </a>
        </div>
      </>
    )
  }

  const monthly = data?.monthlyRevenue || []
  const maxVal = Math.max(...monthly.map((m: any) => m.ltc || 0), 0.01)
  const totalUsd = ltcPrice ? (parseFloat(data?.totalEarned || 0) * ltcPrice).toFixed(2) : '—'

  return (
    <>
      <PageHeader title="Earnings Dashboard" />

      <div className="p-5 flex flex-col gap-5">
        {isLoading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Earned (LTC)" value={parseFloat(data?.totalEarned || 0).toFixed(4)} color="var(--accent-green)" mono />
              <StatCard label="Total Earned (USD)" value={`$${totalUsd}`} />
              <StatCard label="Active Subscribers" value={String(data?.activeSubscribers || 0)} color="var(--accent-purple)" />
              <StatCard label="Tips Received (LTC)" value={parseFloat(data?.tipsTotal || 0).toFixed(4)} color="var(--accent-orange)" mono />
            </div>

            {/* Monthly chart */}
            {monthly.length > 0 && (
              <div className="p-5 rounded-2xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>Monthly Revenue (LTC)</div>
                <div className="flex items-end gap-3 h-24">
                  {monthly.map((m: any, i: number) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${Math.max(4, (m.ltc / maxVal) * 80)}px`,
                          background: 'rgba(126,232,162,0.25)',
                        }}
                        title={`${m.ltc} LTC`}
                      />
                      <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                        {m.month}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent tips */}
            {data?.recentTips?.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="px-5 py-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Recent Tips</div>
                </div>
                {data.recentTips.map((tip: any) => (
                  <div key={tip.id} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-xl">⚡</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{tip.tipper?.displayName || tip.tipper?.username}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {tip.post?.content?.slice(0, 60)}…
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-orange)' }}>
                        +{parseFloat(tip.amount).toFixed(4)} LTC
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(tip.confirmedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
