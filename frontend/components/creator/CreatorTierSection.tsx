'use client'
import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { RecaptchaModal } from '@/components/ui/RecaptchaModal'

const TIERS = [
  { id: 'BASIC', label: 'Basic', price: '0.2', color: '#7a90b0', desc: 'Start earning from subscribers. Access to Basic creator tools.' },
  { id: 'PRO',   label: 'Pro',   price: '0.5', color: 'var(--accent-blue-lt)', desc: 'Priority in Suggested Creators. Pro badge. Advanced analytics.' },
  { id: 'ELITE', label: 'Elite', price: '1.0', color: 'var(--accent-orange)', desc: 'Top placement. Elite badge. All Pro features + early access.' },
]

export function CreatorTierSection() {
  const { user, updateUser } = useAuthStore()
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [showRecaptcha, setShowRecaptcha] = useState(false)
  const [activating, setActivating] = useState(false)
  const [done, setDone] = useState(false)

  const isCreator = user?.creatorTier && user.creatorTier !== 'NONE'

  const handleSelectTier = (tierId: string) => {
    setSelectedTier(tierId)
    setShowRecaptcha(true)
  }

  const handleVerified = async () => {
    setShowRecaptcha(false)
    setActivating(true)
    try {
      const res = await fetch('/api/creator-tier/free-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier: selectedTier }),
      })
      const data = await res.json()
      if (data.activated) {
        updateUser({ creatorTier: selectedTier as any, isVerified: true })
        setDone(true)
      }
    } catch (e) {
      console.error('Creator tier activation error:', e)
    } finally {
      setActivating(false)
    }
  }

  if (done || isCreator) return (
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Your Litecoin checkmark is active</div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
          Become a Creator
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Choose a creator tier to unlock creator status and get your Litecoin checkmark.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIERS.map(t => (
            <div key={t.id}
              onClick={() => !activating && handleSelectTier(t.id)}
              style={{
                padding: '14px 16px', borderRadius: 12,
                border: `1px solid ${selectedTier === t.id ? t.color : 'var(--border)'}`,
                background: 'var(--bg-elevated)',
                cursor: activating ? 'not-allowed' : 'pointer',
                opacity: activating ? 0.6 : 1,
                transition: 'all 160ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = selectedTier === t.id ? t.color : 'var(--border)')}>
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

        {activating && (
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: 'var(--accent-blue-lt)' }}>
            Activating your creator status…
          </div>
        )}
      </div>

      {showRecaptcha && selectedTier && (
        <RecaptchaModal
          title={`Activate ${selectedTier} Creator Tier`}
          subtitle="Complete the check to get your Litecoin checkmark"
          onVerified={handleVerified}
          onClose={() => { setShowRecaptcha(false); setSelectedTier(null) }}
        />
      )}
    </>
  )
}
