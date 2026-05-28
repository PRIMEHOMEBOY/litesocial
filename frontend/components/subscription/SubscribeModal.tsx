'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { RecaptchaModal } from '@/components/ui/RecaptchaModal'
import { formatLtc } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

type Stage = 'info' | 'recaptcha' | 'confirmed'

export function SubscribeModal({ creator, onClose }: { creator: any; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('info')
  const [showRecaptcha, setShowRecaptcha] = useState(false)
  const qc = useQueryClient()
  const me = useAuthStore((s) => s.user)

  const handleVerified = async () => {
    setShowRecaptcha(false)
    // Mark subscription as active server-side (free for now via recaptcha)
    try {
      await fetch('/api/subscriptions/free-activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creatorUsername: creator.username }),
      })
    } catch (e) {
      console.error('Subscription activation error:', e)
    }
    qc.invalidateQueries({ queryKey: ['user', creator.username] })
    qc.invalidateQueries({ queryKey: ['feed'] })
    setStage('confirmed')
  }

  if (stage === 'confirmed') return (
    <Modal title="Subscribed! 🎉" onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 8 }}>
          You're Subscribed!
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
          You now have full access to <strong>{creator.displayName || creator.username}</strong>'s premium content.
        </p>
        <button onClick={onClose} className="ls-btn-primary" style={{ background: 'var(--accent-green)', color: '#000' }}>
          View Premium Content →
        </button>
      </div>
    </Modal>
  )

  return (
    <>
      <Modal title={`Subscribe to ${creator.displayName || creator.username}`} onClose={onClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Price info */}
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Monthly subscription</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--accent-orange)' }}>
              {formatLtc(creator.subscriptionPrice || 0)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>0% platform fee · paid directly to creator</div>
          </div>

          {/* What you get */}
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Unlock all premium posts',
              'Direct LTC payment — no card needed',
              'Cancel anytime — subscription expires naturally',
              'Support your favourite creator directly',
            ].map(f => (
              <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', alignItems: 'flex-start', listStyle: 'none' }}>
                <span style={{ color: 'var(--accent-green)', flexShrink: 0 }}>✓</span>{f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => setShowRecaptcha(true)}
            className="ls-btn-primary"
            style={{ background: 'var(--accent-orange)', fontSize: 15, fontWeight: 700 }}>
            Proceed to Payment →
          </button>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            Clicking proceed will verify you're human, then activate your subscription.
          </div>
        </div>
      </Modal>

      {showRecaptcha && (
        <RecaptchaModal
          title={`Subscribe to ${creator.displayName || creator.username}`}
          subtitle="Complete the check to activate your subscription"
          onVerified={handleVerified}
          onClose={() => setShowRecaptcha(false)}
        />
      )}
    </>
  )
}
