'use client'
// app/(auth)/connect-wallet/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { validateLtcAddress, truncateAddress } from '@/lib/utils'

type Step = 'address' | 'sign' | 'verifying' | 'done'

export default function ConnectWalletPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [step, setStep] = useState<Step>('address')
  const [address, setAddress] = useState('')
  const [nonce, setNonce] = useState('')
  const [signature, setSignature] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGetNonce = async () => {
    if (!validateLtcAddress(address)) {
      setError('Invalid LTC address format')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.getNonce(address)
      setNonce(res.nonce)
      setStep('sign')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!signature.trim()) { setError('Paste your signature first'); return }
    setError('')
    setLoading(true)
    setStep('verifying')
    try {
      const res = await api.walletLogin({ ltcAddress: address, signature, nonce }) as any
      setUser(res.user)
      setStep('done')
      setTimeout(() => router.push('/home'), 1200)
    } catch (e: any) {
      setError(e.message)
      setStep('sign')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 'address', label: 'Enter address', sub: 'Your LTC wallet address (starts with L or M)' },
    { id: 'sign', label: 'Sign nonce', sub: 'Sign the message in your wallet app to prove ownership' },
    { id: 'verifying', label: 'Verify & login', sub: 'Signature verified — JWT session issued' },
  ]

  return (
    <>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Connect Wallet</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        No password needed — just cryptographic proof of wallet ownership.{' '}
        <Link href="/register" style={{ color: 'var(--accent-purple)' }}>Prefer email?</Link>
      </p>

      {/* Step indicators */}
      <div className="flex flex-col gap-2 mb-8">
        {steps.map((s, i) => {
          const stepOrder = ['address', 'sign', 'verifying']
          const currentIdx = stepOrder.indexOf(step)
          const thisIdx = stepOrder.indexOf(s.id)
          const isDone = currentIdx > thisIdx
          const isActive = step === s.id

          return (
            <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: `1px solid ${isActive ? 'var(--accent-purple)' : 'var(--border)'}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{
                  background: isDone ? 'var(--accent-green)' : isActive ? 'var(--accent-purple)' : 'var(--bg-base)',
                  color: isDone ? '#000' : '#fff',
                  border: `1px solid ${isDone ? 'var(--accent-green)' : isActive ? 'var(--accent-purple)' : 'var(--border)'}`,
                  fontFamily: 'var(--font-display)',
                }}>
                {isDone ? '✓' : i + 1}
              </div>
              <div>
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      {step === 'address' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Litecoin Address
            </label>
            <input
              className="ls-input"
              placeholder="LKx2Bv9mR4PdQ3yZj8TfNsAqWe7..."
              value={address}
              onChange={(e) => setAddress(e.target.value.trim())}
              style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}
            />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>}
          <button onClick={handleGetNonce} disabled={!address || loading} className="ls-btn-primary">
            {loading ? 'Requesting nonce…' : 'Get Signing Nonce →'}
          </button>
        </div>
      )}

      {(step === 'sign') && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Sign this message in your wallet
            </label>
            <div className="p-3 rounded-xl text-xs break-all" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'var(--font-display)', color: 'var(--accent-purple)', lineHeight: 1.7 }}>
              {nonce}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Use Litewallet, Exodus, or any LTC wallet with message signing. The signature expires in 5 minutes.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              Paste Signature
            </label>
            <textarea
              className="ls-input resize-none"
              rows={3}
              placeholder="H1AbCd3fGhIj5kLmNoPq..."
              value={signature}
              onChange={(e) => setSignature(e.target.value.trim())}
              style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}
            />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--accent-red)' }}>{error}</p>}
          <button onClick={handleVerify} disabled={!signature || loading} className="ls-btn-primary" style={{ background: 'var(--accent-green)', color: '#000' }}>
            Verify Signature & Sign In →
          </button>
          <button onClick={() => { setStep('address'); setError('') }} className="ls-btn-outline text-sm">
            ← Change address
          </button>
        </div>
      )}

      {step === 'verifying' && (
        <div className="text-center py-8">
          <div className="inline-block w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4"
            style={{ borderColor: 'var(--accent-purple)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Verifying signature…</p>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>
            Verified!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Redirecting to your feed…</p>
        </div>
      )}
    </>
  )
}
