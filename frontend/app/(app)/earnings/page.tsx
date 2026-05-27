'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { timeAgo, formatLtc } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'

function StatCard({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono ? 'var(--font-display)' : undefined, color: color || 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function WithdrawModal({ payoutAddress, totalEarned, onClose }: { payoutAddress: string; totalEarned: string; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'form' | 'done'>('form')

  const handleWithdraw = () => {
    // Simulate withdrawal — in v2 this will trigger an actual on-chain tx
    setStep('done')
  }

  if (step === 'done') return (
    <Modal title="Withdrawal Successful" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8 }}>
          Withdrawal Successful!
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.6 }}>
          {amount} LTC has been sent to your payout address.
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: 24, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
          {payoutAddress}
        </div>
        <button onClick={onClose} className="ls-btn-primary" style={{ background: 'var(--accent-green)', color: '#000' }}>
          Done
        </button>
      </div>
    </Modal>
  )

  return (
    <Modal title="Withdraw Earnings" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Balance info */}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Available balance</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent-green)' }}>
            {parseFloat(totalEarned || '0').toFixed(4)} LTC
          </div>
        </div>

        {/* Amount input */}
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Amount to withdraw (LTC)</div>
          <input
            className="ls-input"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.0000"
            style={{ fontFamily: 'var(--font-display)', fontSize: 22, textAlign: 'center' }}
          />
          <button
            onClick={() => setAmount(parseFloat(totalEarned || '0').toFixed(4))}
            style={{ marginTop: 6, fontSize: 11, color: 'var(--accent-blue-lt)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Withdraw max
          </button>
        </div>

        {/* Destination */}
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>To address</div>
          {payoutAddress ? (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--accent-green)', wordBreak: 'break-all' }}>
              {payoutAddress}
            </div>
          ) : (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', fontSize: 13, color: 'var(--accent-red)' }}>
              ⚠️ No payout address set. Go to Settings → Creator Setup to add one.
            </div>
          )}
        </div>

        {/* Withdraw button */}
        <button
          onClick={handleWithdraw}
          disabled={!payoutAddress || !amount || parseFloat(amount) <= 0}
          className="ls-btn-primary"
          style={{ background: 'var(--accent-green)', color: '#000', fontSize: 16, fontWeight: 700 }}>
          💸 Withdraw {amount ? `${amount} LTC` : ''}
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Automated on-chain withdrawals coming in v2. Funds go directly to your payout address.
        </div>
      </div>
    </Modal>
  )
}

export default function EarningsPage() {
  const user = useAuthStore((s) => s.user)
  const { ltcPrice, fetchPrice } = useWalletStore()
  const [showWithdraw, setShowWithdraw] = useState(false)
  useEffect(() => { fetchPrice() }, [fetchPrice])

  const { data, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => api.getEarnings() as Promise<any>,
  })

  if (user?.creatorTier === 'NONE') {
    return (
      <>
        <PageHeader title="Earnings" />
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, fontFamily: 'var(--font-display)' }}>Become a Creator First</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Subscribe as a creator in Settings to start earning LTC directly from your audience.
          </p>
          <a href="/settings" className="ls-btn-primary" style={{ maxWidth: 220, display: 'inline-flex', textDecoration: 'none' }}>
            Go to Settings →
          </a>
        </div>
      </>
    )
  }

  const monthly = data?.monthlyRevenue || []
  const maxVal = Math.max(...monthly.map((m: any) => m.ltc || 0), 0.01)
  const totalUsd = ltcPrice ? (parseFloat(data?.totalEarned || 0) * ltcPrice).toFixed(2) : '—'
  const totalEarned = data?.totalEarned || '0'

  return (
    <>
      <PageHeader title="Earnings Dashboard">
        <button onClick={() => setShowWithdraw(true)}
          style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'var(--accent-green)', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          💸 Withdraw
        </button>
      </PageHeader>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <StatCard label="Total Earned (LTC)" value={parseFloat(totalEarned).toFixed(4)} color="var(--accent-green)" mono />
              <StatCard label="≈ USD Value" value={`$${totalUsd}`} />
              <StatCard label="Active Subscribers" value={String(data?.activeSubscribers || 0)} color="var(--accent-blue-lt)" />
              <StatCard label="Tips Received (LTC)" value={parseFloat(data?.tipsTotal || 0).toFixed(4)} color="var(--accent-orange)" mono />
            </div>

            {(user as any)?.payoutAddress && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Payout Address</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--accent-green)', wordBreak: 'break-all' }}>{(user as any).payoutAddress}</div>
              </div>
            )}

            {monthly.length > 0 && (
              <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>Monthly Revenue (LTC)</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
                  {monthly.map((m: any, i: number) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: 'rgba(52,93,157,0.35)', height: `${Math.max(4, (m.ltc / maxVal) * 70)}px` }} />
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>{m.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data?.recentTips?.length > 0 && (
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Recent Tips</div>
                {data.recentTips.map((tip: any) => (
                  <div key={tip.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 20 }}>💰</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{tip.tipper?.displayName || tip.tipper?.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tip.post?.content?.slice(0, 60)}…</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--accent-orange)' }}>+{parseFloat(tip.amount).toFixed(4)} LTC</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(tip.confirmedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowWithdraw(true)} className="ls-btn-primary" style={{ background: 'var(--accent-green)', color: '#000' }}>
              💸 Withdraw Earnings
            </button>
          </>
        )}
      </div>

      {showWithdraw && (
        <WithdrawModal
          payoutAddress={(user as any)?.payoutAddress || ''}
          totalEarned={totalEarned}
          onClose={() => setShowWithdraw(false)}
        />
      )}
    </>
  )
}
