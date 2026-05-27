'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { Modal } from '@/components/ui/Modal'
import { QRCodeSVG } from 'qrcode.react'

const TIERS = [
  { id: 'BASIC', label: 'Basic', price: '0.2', color: '#7a90b0', desc: 'Start earning from subscribers. Access to Basic creator tools.' },
  { id: 'PRO',   label: 'Pro',   price: '0.5', color: 'var(--accent-blue-lt)', desc: 'Priority in Suggested Creators. Pro badge. Advanced analytics.' },
  { id: 'ELITE', label: 'Elite', price: '1.0', color: 'var(--accent-orange)', desc: 'Top placement. Elite badge. All Pro features + early access.' },
]

export function CreatorTierSection() {
  const { user, updateUser } = useAuthStore()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [depositInfo, setDepositInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [polling, setPolling] = useState(false)

  const isCreator = user?.creatorTier && user.creatorTier !== 'NONE'

  const initMutation = useMutation({
    mutationFn: (tier: string) =>
      fetch('/api/creator-tier/initiate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ tier }) }).then(r => r.json()),
    onSuccess: (data: any) => setDepositInfo(data),
  })

  const handleSelect = (tier: string) => {
    setSelectedTier(tier)
    initMutation.mutate(tier)
  }

  const copy = () => {
    navigator.clipboard.writeText(depositInfo?.depositAddress || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (isCreator) return (
    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 12 }}>Creator Status</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 12, background: 'rgba(52,93,157,0.08)', border: '1px solid rgba(52,93,157,0.25)' }}>
        <img src="/ltc-logo.svg" alt="verified" style={{ width: 32, height: 32 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {user?.creatorTier} Creator
            <img src="/ltc-logo.svg" alt="✓" style={{ width: 16, height: 16, marginLeft: 6, verticalAlign: 'middle' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your Litecoin checkmark is active</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>Become a Creator</div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        Pay a one-time LTC fee to unlock creator status, get your Litecoin checkmark, and start earning from subscribers.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIERS.map(t => (
          <div key={t.id}
            onClick={() => !initMutation.isPending && handleSelect(t.id)}
            style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${selectedTier === t.id ? t.color : 'var(--border)'}`, background: selectedTier === t.id ? `${t.color}12` : 'var(--bg-elevated)', cursor: 'pointer', transition: 'all 160ms' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src="/ltc-logo.svg" alt="LTC" style={{ width: 20, height: 20 }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: t.color }}>{t.label}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: t.color }}>{t.price} LTC</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Payment modal */}
      {selectedTier && depositInfo && (
        <Modal title={`Activate ${selectedTier} Creator`} onClose={() => { setSelectedTier(null); setDepositInfo(null) }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Send exactly</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, color: 'var(--accent-orange)' }}>{depositInfo.amount} LTC</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>One-time fee · Activates after 3 confirmations</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ padding: 12, background: '#fff', borderRadius: 14 }}>
              <QRCodeSVG value={depositInfo.ltcUri} size={150} />
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Deposit address</div>
          <div onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <span style={{ flex: 1, fontSize: 11, fontFamily: 'var(--font-display)', wordBreak: 'break-all' }}>{depositInfo.depositAddress}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{copied ? '✓' : '📋'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>Watching for payment · auto-activates after 3 blocks</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center', lineHeight: 1.6 }}>
            You can close this — payment is tracked server-side. Your checkmark activates automatically.
          </div>
        </Modal>
      )}
    </div>
  )
}
