'use client'
import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useCreatorTier, useWeb3 } from '@/lib/web3/useWeb3'

const TIERS = [
  { id: 'BASIC', label: 'Basic', price: '0.2', color: '#7a90b0', desc: 'Start earning from subscribers. Access to Basic creator tools.' },
  { id: 'PRO',   label: 'Pro',   price: '0.5', color: 'var(--accent-blue-lt)', desc: 'Priority in Suggested Creators. Pro badge. Advanced analytics.' },
  { id: 'ELITE', label: 'Elite', price: '1.0', color: 'var(--accent-orange)', desc: 'Top placement. Elite badge. All Pro features + early access.' },
]

export function CreatorTierSection() {
  const { user, updateUser } = useAuthStore()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [step, setStep] = useState<'select' | 'paying' | 'done' | 'error'>('select')
  const [txHash, setTxHash] = useState<string | null>(null)
  const { address, connect } = useWeb3()
  const { registerCreator, loading, error } = useCreatorTier()

  const isCreator = user?.creatorTier && user.creatorTier !== 'NONE'

  const handleRegister = async (tierId: string) => {
    setSelectedTier(tierId)
    if (!address) {
      try { await connect() } catch { return }
    }
    const tier = TIERS.find(t => t.id === tierId)!
    setStep('paying')
    try {
      // Use wallet address as payout address by default (can be changed in settings)
      const payoutAddress = address || user?.payoutAddress || ''
      if (!payoutAddress) {
        alert('Please add a payout address in Settings first')
        setStep('select')
        return
      }
      const hash = await registerCreator(
        user!.username,
        tierId as 'BASIC' | 'PRO' | 'ELITE',
        tier.price,
        payoutAddress
      )
      setTxHash(hash)
      updateUser({ creatorTier: tierId as any, isVerified: true })
      setStep('done')
    } catch (e: any) {
      setStep('error')
    }
  }

  if (step === 'done' || isCreator) return (
    <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
        Creator Status
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, background: 'rgba(52,93,157,0.08)', border: '1px solid rgba(52,93,157,0.25)' }}>
        <img src="/ltc-logo.svg" alt="verified" style={{ width: 32, height: 32 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            {user?.creatorTier || selectedTier} Creator
            <img src="/ltc-logo.svg" alt="✓" style={{ width: 16, height: 16 }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Your Litecoin checkmark is active on-chain
          </div>
          {txHash && (
            <a href={`https://explorer.liteforge.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: 'var(--accent-blue-lt)', fontFamily: 'var(--font-display)' }}>
              View TX →
            </a>
          )}
        </div>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
        Become a Creator
      </div>
      <div style={{ padding: 14, borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--accent-red)', marginBottom: 8 }}>
          ❌ {error || 'Transaction failed. Please try again.'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Make sure your wallet is connected to the LitVM network and has enough LTC.
        </div>
      </div>
      <button onClick={() => setStep('select')} className="ls-btn-outline" style={{ fontSize: 13 }}>
        Try Again
      </button>
    </div>
  )

  return (
    <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
        Become a Creator
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        Pay a one-time fee on LitVM to unlock creator status, your Litecoin checkmark, and start earning.
      </p>

      {/* Wallet status */}
      {address ? (
        <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-display)' }}>
          ✓ Wallet: {address.slice(0, 8)}…{address.slice(-6)}
        </div>
      ) : (
        <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.2)', fontSize: 12, color: 'var(--accent-orange)' }}>
          ⚠️ Connect your LitVM wallet to pay on-chain
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIERS.map(t => (
          <div key={t.id}
            onClick={() => !loading && step !== 'paying' && handleRegister(t.id)}
            style={{
              padding: '14px 16px', borderRadius: 12,
              border: `1px solid ${selectedTier === t.id && step === 'paying' ? t.color : 'var(--border)'}`,
              background: 'var(--bg-elevated)',
              cursor: loading || step === 'paying' ? 'not-allowed' : 'pointer',
              opacity: loading || step === 'paying' ? 0.6 : 1,
              transition: 'all 160ms',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = t.color }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.borderColor = selectedTier === t.id && step === 'paying' ? t.color : 'var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/ltc-logo.svg" alt="LTC" style={{ width: 18, height: 18 }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: t.color }}>{t.label}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: t.color }}>
                {t.price} LTC
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {step === 'paying' && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(52,93,157,0.08)', border: '1px solid rgba(52,93,157,0.2)' }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(74,128,212,0.3)', borderTopColor: '#4a80d4', animation: 'spin 700ms linear infinite', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--accent-blue-lt)' }}>Waiting for transaction confirmation on LitVM…</span>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center' }}>
        One-time fee paid on LitVM blockchain. Requires MetaMask or LitVM-compatible wallet.
      </div>
    </div>
  )
}
