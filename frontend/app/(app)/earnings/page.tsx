'use client'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/useAuthStore'
import { useWalletStore } from '@/store/useWalletStore'
import { timeAgo, formatLtc } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useWithdraw, useWeb3, getOnChainCreatorBalance } from '@/lib/web3/useWeb3'

function StatCard({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono ? 'var(--font-display)' : undefined, color: color || 'var(--text-primary)', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function WithdrawModal({ username, onClose }: { username: string; onClose: () => void }) {
  const { withdraw, loading, error, txHash } = useWithdraw()
  const { address, connect } = useWeb3()
  const [onChainBalance, setOnChainBalance] = useState<string | null>(null)
  const [step, setStep] = useState<'ready' | 'withdrawing' | 'done' | 'error'>('ready')

  useEffect(() => {
    getOnChainCreatorBalance(username).then(setOnChainBalance)
  }, [username])

  const handleWithdraw = async () => {
    if (!address) {
      try { await connect() } catch { return }
    }
    setStep('withdrawing')
    try {
      await withdraw(username)
      setStep('done')
    } catch {
      setStep('error')
    }
  }

  if (step === 'done') return (
    <Modal title="Withdrawal Successful" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8 }}>
          Withdrawal Successful!
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.6 }}>
          Your LTC has been sent to your payout address on LitVM.
        </p>
        {txHash && (
          <a href={`https://explorer.liteforge.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--accent-blue-lt)', fontFamily: 'var(--font-display)', wordBreak: 'break-all', display: 'block', marginBottom: 20 }}>
            TX: {txHash.slice(0, 24)}…
          </a>
        )}
        <button onClick={onClose} className="ls-btn-primary" style={{ background: 'var(--accent-green)', color: '#000' }}>Done</button>
      </div>
    </Modal>
  )

  if (step === 'error') return (
    <Modal title="Withdrawal Failed" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Transaction Failed</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {error || 'Make sure your wallet is connected to LitVM and try again.'}
        </p>
        <button onClick={() => setStep('ready')} className="ls-btn-primary">Try Again</button>
      </div>
    </Modal>
  )

  return (
    <Modal title="Withdraw Earnings" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* On-chain balance */}
        <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Available on-chain balance</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent-green)' }}>
            {onChainBalance !== null ? `${onChainBalance} LTC` : 'Loading…'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Smart contract balance on LitVM</div>
        </div>

        {/* How it works */}
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Withdraws all your pending earnings from the smart contract',
            'Sends directly to your registered payout address',
            '0% platform fee — you keep everything',
            'Transaction confirmed on LitVM blockchain',
          ].map(f => (
            <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', alignItems: 'flex-start', listStyle: 'none' }}>
              <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>✓</span>{f}
            </li>
          ))}
        </ul>

        {/* Wallet status */}
        {address ? (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-display)' }}>
            ✓ Connected: {address.slice(0, 8)}…{address.slice(-6)}
          </div>
        ) : (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.2)', fontSize: 12, color: 'var(--accent-orange)' }}>
            ⚠️ Connect your LitVM wallet to withdraw
          </div>
        )}

        <button onClick={handleWithdraw}
          disabled={loading || step === 'withdrawing' || onChainBalance === '0.0' || onChainBalance === null}
          className="ls-btn-primary"
          style={{ background: 'var(--accent-green)', color: '#000', opacity: loading ? 0.7 : 1 }}>
          {loading || step === 'withdrawing'
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', animation: 'spin 700ms linear infinite', display: 'inline-block' }} />
                Withdrawing on-chain…
              </span>
            : address ? '💸 Withdraw to Payout Address' : '🔗 Connect Wallet & Withdraw'
          }
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Requires your payout wallet connected to LitVM. Only the registered payout address can withdraw.
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
  const totalEarned = data?.totalEarned || '0'
  const totalUsd = ltcPrice ? (parseFloat(totalEarned) * ltcPrice).toFixed(2) : '—'

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

            {/* On-chain note */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(52,93,157,0.08)', border: '1px solid rgba(52,93,157,0.2)', fontSize: 12, color: 'var(--accent-blue-lt)', lineHeight: 1.7 }}>
              ⛓️ Earnings are held in the PrimeDesk smart contract on LitVM. Withdraw at any time — funds go directly to your payout address with 0% fee.
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

      {showWithdraw && user && (
        <WithdrawModal username={user.username} onClose={() => setShowWithdraw(false)} />
      )}
    </>
  )
}
