'use client'
// components/subscription/TipModal.tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Modal } from '@/components/ui/Modal'
import { formatLtc } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'

const PRESETS = ['0.1', '0.25', '0.5', '1.0', '2.5', '5.0']
type Stage = 'select' | 'awaiting' | 'confirmed'

export function TipModal({ post, author, onClose }: { post: any; author: any; onClose: () => void }) {
  const [selected, setSelected] = useState('0.5')
  const [custom, setCustom] = useState('')
  const [stage, setStage] = useState<Stage>('select')
  const [depositInfo, setDepositInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const amount = custom || selected

  const initMutation = useMutation({
    mutationFn: () => api.initiateTip(post.id, amount),
    onSuccess: (data: any) => { setDepositInfo(data); setStage('awaiting') },
  })

  if (stage === 'confirmed') return (
    <Modal title="Tip Sent! 💸" onClose={onClose}>
      <div className="text-center py-6">
        <div className="text-6xl mb-4">💸</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>
          {formatLtc(amount)} Sent!
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your tip to <strong>{author.displayName || author.username}</strong> will be confirmed on-chain shortly.
        </p>
        <button onClick={onClose} className="ls-btn-primary mt-6">Done</button>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Tip ${author.displayName || author.username}`} onClose={onClose}>
      {stage === 'select' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Select an amount or enter a custom value</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button key={p}
                onClick={() => { setSelected(p); setCustom('') }}
                className="py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  border: `1px solid ${selected === p && !custom ? 'var(--accent-orange)' : 'var(--border)'}`,
                  background: selected === p && !custom ? 'rgba(247,147,26,0.1)' : 'var(--bg-elevated)',
                  color: selected === p && !custom ? 'var(--accent-orange)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                }}>
                {p} LTC
              </button>
            ))}
          </div>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="Custom amount (LTC)"
            className="ls-input text-center"
            style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}
          />
          <div className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {parseFloat(amount) > 0 ? formatLtc(amount) : '—'}
          </div>
          {initMutation.isError && (
            <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{(initMutation.error as any)?.message}</p>
          )}
          <button
            onClick={() => initMutation.mutate()}
            disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || initMutation.isPending}
            className="ls-btn-primary"
            style={{ background: 'var(--accent-orange)' }}>
            {initMutation.isPending ? 'Generating…' : `Send ${formatLtc(amount)} →`}
          </button>
        </div>
      )}

      {stage === 'awaiting' && depositInfo && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Send exactly</div>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-orange)' }}>
              {formatLtc(amount)}
            </div>
          </div>
          <div className="p-4 rounded-2xl" style={{ background: '#fff' }}>
            <QRCodeSVG value={depositInfo.ltcUri} size={150} />
          </div>
          <div className="w-full">
            <div className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deposit address</div>
            <div onClick={() => { navigator.clipboard.writeText(depositInfo.depositAddress); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="flex items-center gap-2 p-3 rounded-xl cursor-pointer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <span className="flex-1 text-xs break-all" style={{ fontFamily: 'var(--font-display)' }}>
                {depositInfo.depositAddress}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{copied ? '✓' : '📋'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full p-3 rounded-xl"
            style={{ background: 'rgba(126,232,162,0.06)', border: '1px solid rgba(126,232,162,0.2)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-green)' }} />
            <span className="text-xs" style={{ color: 'var(--accent-green)' }}>
              Watching for payment on-chain
            </span>
          </div>
          <button onClick={() => setStage('confirmed')} className="ls-btn-outline text-sm w-full">
            I've sent the payment →
          </button>
        </div>
      )}
    </Modal>
  )
}
