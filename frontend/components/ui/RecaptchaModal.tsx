'use client'
// Simple recaptcha-style checkbox modal
import { useState } from 'react'

interface Props {
  title: string
  subtitle: string
  onVerified: () => void
  onClose: () => void
}

export function RecaptchaModal({ title, subtitle, onVerified, onClose }: Props) {
  const [checked, setChecked] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  const handleCheck = () => {
    if (checked || verifying) return
    setVerifying(true)
    // Simulate a brief verification delay like real reCAPTCHA
    setTimeout(() => {
      setVerifying(false)
      setChecked(true)
      setVerified(true)
      // Auto-proceed after 800ms
      setTimeout(() => onVerified(), 800)
    }, 1200)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 380, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Security Check</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>

        <div style={{ padding: '24px 20px' }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6, textAlign: 'center' }}>
            {title}<br />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</span>
          </p>

          {/* reCAPTCHA-style box */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 4,
            background: '#f9f9f9', border: '1px solid #d3d3d3',
            cursor: checked ? 'default' : 'pointer',
            userSelect: 'none',
          }} onClick={handleCheck}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Checkbox */}
              <div style={{
                width: 24, height: 24, borderRadius: 2,
                border: checked ? 'none' : '2px solid #c1c1c1',
                background: checked ? '#4ade80' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 200ms', position: 'relative',
              }}>
                {verifying && (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #4a80d4', borderTopColor: 'transparent', animation: 'spin 700ms linear infinite' }} />
                )}
                {checked && !verifying && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 14, color: '#333', fontFamily: 'Arial, sans-serif' }}>
                {verified ? "I'm verified ✓" : "I'm not a robot"}
              </span>
            </div>

            {/* reCAPTCHA branding */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ fontSize: 20 }}>🤖</div>
              <div style={{ fontSize: 8, color: '#999', fontFamily: 'Arial,sans-serif', textAlign: 'center', lineHeight: 1.3 }}>
                reCAPTCHA<br />
                <span style={{ fontSize: 7 }}>Privacy - Terms</span>
              </div>
            </div>
          </div>

          {verified && (
            <div style={{ marginTop: 16, padding: '12px', borderRadius: 10, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--accent-green)', fontWeight: 600 }}>
                ✓ Verified! Processing…
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
