'use client'
// components/subscription/SubscribeModal.tsx
import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Modal } from '@/components/ui/Modal'
import { formatLtc } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'

type Stage = 'init' | 'awaiting' | 'confirmed'

export function SubscribeModal({ creator, onClose }: { creator: any; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('init')
  const [depositInfo, setDepositInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(172800) // 48h

  const initMutation = useMutation({
    mutationFn: () => api.initiateSubscription(creator.username),
    onSuccess: (data: any) => { setDepositInfo(data); setStage('awaiting') },
  })

  // Poll subscription status
  const { data: statusData } = useQuery({
    queryKey: ['sub-status', creator.username],
    queryFn: () => api.getSubscriptionStatus(creator.username) as Promise<any>,
    refetchInterval: stage === 'awaiting' ? 5000 : false,
    enabled: stage === 'awaiting',
  })

  useEffect(() => {
    if (statusData?.isSubscribed) setStage('confirmed')
  }, [statusData])

  useEffect(() => {
    if (stage !== 'awaiting') return
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [stage])

  const fmt = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(countdown / 3600)
  const m = Math.floor((countdown % 3600) / 60)
  const s = countdown % 60

  const copy = () => {
    navigator.clipboard.writeText(depositInfo?.depositAddress || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (stage === 'confirmed') return (
    <Modal title="Subscription Active 🎉" onClose={onClose}>
      <div className="text-center py-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>
          Payment Confirmed!
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Your subscription to <strong>{creator.displayName || creator.username}</strong> is now active for 30 days.
        </p>
        <button onClick={onClose} className="ls-btn-primary" style={{ background: 'var(--accent-green)', color: '#000' }}>
          View Premium Content →
        </button>
      </div>
    </Modal>
  )

  return (
    <Modal title={`Subscribe to ${creator.displayName || creator.username}`} onClose={onClose}>
      {stage === 'init' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Monthly price</div>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-orange)' }}>
              {formatLtc(creator.subscriptionPrice || 0)}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>0% platform fee · paid directly to creator</div>
          </div>
          <ul className="text-sm flex flex-col gap-2" style={{ color: 'var(--text-secondary)' }}>
            {['Unlock all premium posts', 'Direct LTC payment — no card needed', 'Auto-detected after 3 confirmations (~7.5 min)', 'Cancel anytime — subscription expires naturally'].map((f) => (
              <li key={f} className="flex gap-2"><span style={{ color: 'var(--accent-green)' }}>✓</span>{f}</li>
            ))}
          </ul>
          {initMutation.isError && (
            <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{(initMutation.error as any)?.message}</p>
          )}
          <button onClick={() => initMutation.mutate()} disabled={initMutation.isPending} className="ls-btn-primary" style={{ background: 'var(--accent-orange)' }}>
            {initMutation.isPending ? 'Generating address…' : 'Proceed to Payment →'}
          </button>
        </div>
      )}

      {stage === 'awaiting' && depositInfo && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Send exactly</div>
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-orange)' }}>
              {formatLtc(depositInfo.amount)}
            </div>
          </div>

          {/* QR Code */}
          <div className="p-4 rounded-2xl" style={{ background: '#fff' }}>
            <QRCodeSVG value={depositInfo.ltcUri} size={160} />
          </div>

          {/* Address */}
          <div className="w-full">
            <div className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deposit address</div>
            <div
              onClick={copy}
              className="flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <span className="flex-1 text-xs break-all" style={{ fontFamily: 'var(--font-display)' }}>
                {depositInfo.depositAddress}
              </span>
              <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                {copied ? '✓' : '📋'}
              </span>
            </div>
          </div>

          {/* Countdown */}
          <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Expires in <span style={{ color: 'var(--accent-red)' }}>{fmt(h)}:{fmt(m)}:{fmt(s)}</span>
          </div>

          {/* Polling indicator */}
          <div className="flex items-center gap-2 w-full p-3 rounded-xl"
            style={{ background: 'rgba(126,232,162,0.06)', border: '1px solid rgba(126,232,162,0.2)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-green)' }} />
            <span className="text-xs" style={{ color: 'var(--accent-green)' }}>
              Watching for payment · auto-confirms after 3 blocks (~7.5 min)
            </span>
          </div>

          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Open this page in Litewallet or Exodus to pre-fill the payment. You can close this modal — payment is tracked server-side.
          </p>
        </div>
      )}
    </Modal>
  )
}
