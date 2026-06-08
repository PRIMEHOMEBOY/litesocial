'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { formatLtc } from '@/lib/utils'
import { useSubscribe, useWeb3 } from '@/lib/web3/useWeb3'

type Stage = 'info' | 'connect' | 'paying' | 'confirmed' | 'error'

export function SubscribeModal({ creator, onClose }: { creator: any; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('info')
  const [txHash, setTxHash] = useState<string | null>(null)
  const qc = useQueryClient()
  const { address, connect, status } = useWeb3()
  const { subscribe, loading, error: subError } = useSubscribe()

  const price = creator.subscriptionPrice?.toString() || '0'

  const handleConnect = async () => {
    setStage('connect')
    try {
      await connect()
      setStage('info')
    } catch {
      setStage('error')
    }
  }

  const handlePay = async () => {
    if (!address) { await handleConnect(); return }
    setStage('paying')
    try {
      const hash = await subscribe(creator.username, price)
      setTxHash(hash)
      qc.invalidateQueries({ queryKey: ['user', creator.username] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      setStage('confirmed')
    } catch (e: any) {
      setStage('error')
    }
  }

  if (stage === 'confirmed') return (
    <Modal title="Subscribed! 🎉" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8 }}>
          Subscription Confirmed!
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          You're now subscribed to <strong>{creator.displayName || creator.username}</strong> on-chain.
        </p>
        {txHash && (
          <a href={`https://explorer.liteforge.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--accent-blue-lt)', fontFamily: 'var(--font-display)', wordBreak: 'break-all', display: 'block', marginBottom: 20 }}>
            TX: {txHash.slice(0, 20)}…
          </a>
        )}
        <button onClick={onClose} className="ls-btn-primary" style={{ background: 'var(--accent-green)', color: '#000' }}>
          View Premium Content →
        </button>
      </div>
    </Modal>
  )

  if (stage === 'error') return (
    <Modal title="Transaction Failed" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Transaction Failed</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          {subError || 'Something went wrong. Please try again.'}
        </p>
        <button onClick={() => setStage('info')} className="ls-btn-primary">Try Again</button>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Subscribe to ${creator.displayName || creator.username}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Price */}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly subscription</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent-orange)' }}>
            {formatLtc(price)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Paid on-chain · 0% platform fee · LitVM</div>
        </div>

        {/* Benefits */}
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Unlock all premium posts instantly',
            'Direct on-chain LTC payment to creator',
            '30-day subscription, verified on LitVM',
            'Cancel anytime — no recurring charge',
          ].map(f => (
            <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', alignItems: 'flex-start', listStyle: 'none' }}>
              <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>✓</span>{f}
            </li>
          ))}
        </ul>

        {/* Wallet status */}
        {address ? (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-display)', wordBreak: 'break-all' }}>
            ✓ Wallet: {address.slice(0, 8)}…{address.slice(-6)}
          </div>
        ) : (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.2)', fontSize: 12, color: 'var(--accent-orange)' }}>
            ⚠️ Connect your LitVM wallet to pay on-chain
          </div>
        )}

        {/* Pay button */}
        <button onClick={handlePay} disabled={loading || stage === 'connect'}
          className="ls-btn-primary"
          style={{ background: 'var(--accent-orange)', fontSize: 15, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 700ms linear infinite', display: 'inline-block' }} />
              {stage === 'connect' ? 'Connecting wallet…' : 'Waiting for transaction…'}
            </span>
          ) : address ? `Pay ${formatLtc(price)} on LitVM →` : 'Connect Wallet & Pay →'}
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
          Requires MetaMask or a LitVM-compatible wallet connected to LitVM network.
        </div>
      </div>
    </Modal>
  )
}
