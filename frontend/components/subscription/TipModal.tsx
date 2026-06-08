'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { formatLtc } from '@/lib/utils'
import { useTip, useWeb3 } from '@/lib/web3/useWeb3'

const PRESETS = ['0.1', '0.25', '0.5', '1.0', '2.5', '5.0']
type Stage = 'select' | 'paying' | 'confirmed' | 'error'

export function TipModal({ post, author, onClose }: { post: any; author: any; onClose: () => void }) {
  const [selected, setSelected] = useState('0.5')
  const [custom, setCustom] = useState('')
  const [stage, setStage] = useState<Stage>('select')
  const [txHash, setTxHash] = useState<string | null>(null)
  const qc = useQueryClient()
  const { address, connect } = useWeb3()
  const { sendTip, loading, error: tipError } = useTip()

  const amount = custom || selected

  const handleSend = async () => {
    if (!address) {
      try { await connect() } catch { return }
    }
    setStage('paying')
    try {
      const hash = await sendTip(post.id, author.username, amount)
      setTxHash(hash)
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['post', post.id] })
      setStage('confirmed')
    } catch {
      setStage('error')
    }
  }

  if (stage === 'confirmed') return (
    <Modal title="Tip Sent! 💰" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>💰</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8 }}>
          {formatLtc(amount)} Sent On-Chain!
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          Your tip to <strong>{author.displayName || author.username}</strong> is confirmed on LitVM.
        </p>
        {txHash && (
          <a href={`https://explorer.liteforge.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--accent-blue-lt)', fontFamily: 'var(--font-display)', wordBreak: 'break-all', display: 'block', marginBottom: 20 }}>
            TX: {txHash.slice(0, 20)}…
          </a>
        )}
        <button onClick={onClose} className="ls-btn-primary">Done</button>
      </div>
    </Modal>
  )

  if (stage === 'error') return (
    <Modal title="Transaction Failed" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Transaction Failed</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {tipError || 'Something went wrong. Please try again.'}
        </p>
        <button onClick={() => setStage('select')} className="ls-btn-primary">Try Again</button>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Tip ${author.displayName || author.username}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Select an amount or enter custom</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {PRESETS.map(p => (
            <button key={p} onClick={() => { setSelected(p); setCustom('') }}
              style={{
                padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all 160ms',
                border: `1px solid ${selected === p && !custom ? 'var(--accent-orange)' : 'var(--border)'}`,
                background: selected === p && !custom ? 'rgba(247,147,26,0.1)' : 'var(--bg-elevated)',
                color: selected === p && !custom ? 'var(--accent-orange)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)',
              }}>
              {p} LTC
            </button>
          ))}
        </div>

        <input value={custom} onChange={e => setCustom(e.target.value.replace(/[^0-9.]/g, ''))}
          placeholder="Custom amount (LTC)"
          className="ls-input"
          style={{ fontFamily: 'var(--font-display)', fontSize: 18, textAlign: 'center' }} />

        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {parseFloat(amount) > 0 ? formatLtc(amount) : '—'}
        </div>

        {/* Wallet status */}
        {address ? (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-display)' }}>
            ✓ {address.slice(0, 8)}…{address.slice(-6)}
          </div>
        ) : (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.2)', fontSize: 12, color: 'var(--accent-orange)' }}>
            ⚠️ Connect your LitVM wallet to tip on-chain
          </div>
        )}

        <button onClick={handleSend}
          disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || loading}
          className="ls-btn-primary"
          style={{ background: 'var(--accent-orange)', opacity: loading ? 0.7 : 1 }}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 700ms linear infinite', display: 'inline-block' }} />
                Waiting for transaction…
              </span>
            : `💰 Send ${amount ? formatLtc(amount) : ''} on LitVM →`
          }
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          Requires MetaMask or LitVM-compatible wallet.
        </div>
      </div>
    </Modal>
  )
}
