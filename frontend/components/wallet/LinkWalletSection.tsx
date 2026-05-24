'use client'
// components/wallet/LinkWalletSection.tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { validateLtcAddress, truncateAddress } from '@/lib/utils'

type Step = 'idle' | 'enter' | 'sign' | 'done'

export function LinkWalletSection() {
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState<Step>('idle')
  const [address, setAddress] = useState('')
  const [nonce, setNonce] = useState('')
  const [signature, setSignature] = useState('')
  const [error, setError] = useState('')
  const [loadingNonce, setLoadingNonce] = useState(false)

  const linkMutation = useMutation({
    mutationFn: () => api.linkWallet({ ltcAddress: address, signature, nonce }),
    onSuccess: () => {
      updateUser({ ltcAddress: address })
      setStep('done')
    },
    onError: (e: any) => setError(e.message),
  })

  const handleGetNonce = async () => {
    if (!validateLtcAddress(address)) { setError('Invalid LTC address'); return }
    setError('')
    setLoadingNonce(true)
    try {
      const res = await api.getNonce(address)
      setNonce(res.nonce)
      setStep('sign')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingNonce(false)
    }
  }

  if (user?.ltcAddress) return (
    <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Linked Wallet</div>
      <div className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: 'rgba(126,232,162,0.06)', border: '1px solid rgba(126,232,162,0.2)' }}>
        <span style={{ color: 'var(--accent-green)' }}>✓</span>
        <span className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>
          {truncateAddress(user.ltcAddress)}
        </span>
      </div>
    </div>
  )

  return (
    <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Link LTC Wallet</div>

      {step === 'idle' && (
        <>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Link your Litecoin wallet to receive subscriptions and tips directly on-chain.
          </p>
          <button onClick={() => setStep('enter')} className="ls-btn-outline text-sm">
            🔗 Link Wallet
          </button>
        </>
      )}

      {step === 'enter' && (
        <div className="flex flex-col gap-3">
          <input className="ls-input" placeholder="LKx2Bv9mR4PdQ3yZj8TfNsAqWe7..."
            value={address} onChange={(e) => setAddress(e.target.value.trim())}
            style={{ fontFamily: 'var(--font-display)', fontSize: 13 }} />
          {error && <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleGetNonce} disabled={!address || loadingNonce} className="ls-btn-primary flex-1 text-sm">
              {loadingNonce ? 'Getting nonce…' : 'Continue →'}
            </button>
            <button onClick={() => setStep('idle')} className="ls-btn-outline text-sm px-3">Cancel</button>
          </div>
        </div>
      )}

      {step === 'sign' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl text-xs break-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontFamily: 'var(--font-display)', color: 'var(--accent-purple)', lineHeight: 1.7 }}>
            {nonce}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Sign this message in Litewallet or Exodus, then paste the signature below.
          </p>
          <textarea className="ls-input resize-none" rows={3} placeholder="H1AbCd3fGhIj5kLmNoPq..."
            value={signature} onChange={(e) => setSignature(e.target.value.trim())}
            style={{ fontFamily: 'var(--font-display)', fontSize: 12 }} />
          {error && <p className="text-xs" style={{ color: 'var(--accent-red)' }}>{error}</p>}
          <button onClick={() => linkMutation.mutate()} disabled={!signature || linkMutation.isPending}
            className="ls-btn-primary text-sm" style={{ background: 'var(--accent-green)', color: '#000' }}>
            {linkMutation.isPending ? 'Verifying…' : 'Verify & Link Wallet →'}
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="p-4 rounded-xl text-sm"
          style={{ background: 'rgba(126,232,162,0.06)', border: '1px solid rgba(126,232,162,0.2)', color: 'var(--accent-green)' }}>
          ✓ Wallet linked successfully!
        </div>
      )}
    </div>
  )
}
