'use client'
// app/(app)/settings/page.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { UpdateUserSchema } from '@/lib/schemas'
import { PageHeader } from '@/components/layout/PageHeader'
import { FormField } from '@/components/ui/FormField'
import { LinkWalletSection } from '@/components/wallet/LinkWalletSection'
import { z } from 'zod'

type FormData = z.infer<typeof UpdateUserSchema>

const TIERS = [
  { id: 'BASIC', label: 'Basic', price: '0.2 LTC/mo', color: '#888' },
  { id: 'PRO', label: 'Pro', price: '0.5 LTC/mo', color: 'var(--accent-purple)' },
  { id: 'ELITE', label: 'Elite', price: '1.0 LTC/mo', color: 'var(--accent-orange)' },
] as const

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      payoutAddress: user?.payoutAddress || '',
      creatorTier: (user?.creatorTier as any) || 'NONE',
      subscriptionPrice: user?.subscriptionPrice || undefined,
    },
  })

  const selectedTier = watch('creatorTier')

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.updateMe(data),
    onSuccess: (updated: any) => {
      updateUser(updated)
      setSaved(true)
      setServerError('')
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (e: any) => setServerError(e.message),
  })

  const logout = useAuthStore((s) => s.logout)

  return (
    <>
      <PageHeader title="Settings" />

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        {/* Profile */}
        <Section title="Profile">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Display Name" error={errors.displayName?.message}>
              <input {...register('displayName')} className="ls-input" />
            </FormField>
            <FormField label="Username" error={errors.username?.message}>
              <input {...register('username')} className="ls-input" />
            </FormField>
          </div>
          <FormField label="Bio" error={errors.bio?.message}>
            <textarea {...register('bio')} rows={3} className="ls-input resize-none" placeholder="Tell the world about yourself…" />
          </FormField>
        </Section>

        {/* Creator setup */}
        <Section title="Creator Setup">
          <div className="mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Creator Tier</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setValue('creatorTier', t.id)}
                className="p-4 rounded-xl text-center transition-all"
                style={{
                  border: `1px solid ${selectedTier === t.id ? t.color : 'var(--border)'}`,
                  background: selectedTier === t.id ? `${t.color}15` : 'var(--bg-elevated)',
                }}>
                <div className="font-bold text-base mb-1" style={{ color: selectedTier === t.id ? t.color : 'var(--text-primary)' }}>{t.label}</div>
                <div className="text-xs" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}>{t.price}</div>
              </button>
            ))}
          </div>
          <FormField label="Monthly Subscription Price (LTC)" error={errors.subscriptionPrice?.message}>
            <input {...register('subscriptionPrice', { valueAsNumber: true })} type="number" step="0.01" min="0.01" className="ls-input" style={{ fontFamily: 'var(--font-display)' }} />
          </FormField>
          <FormField label="Payout LTC Address" error={errors.payoutAddress?.message}>
            <input {...register('payoutAddress')} className="ls-input" placeholder="LKx2Bv9mR4PdQ3..." style={{ fontFamily: 'var(--font-display)', fontSize: 13 }} />
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Subscribers' payments go directly to this address. 0% platform fee.</p>
          </FormField>
        </Section>

        {serverError && (
          <div className="mx-5 mb-4 text-sm px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,107,157,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,107,157,0.2)' }}>
            {serverError}
          </div>
        )}

        <div className="px-5 pb-5 flex gap-3">
          <button type="submit" disabled={isSubmitting} className="ls-btn-primary flex-1">
            {isSubmitting ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Wallet linking */}
      <LinkWalletSection />

      {/* Security */}
      <Section title="Security & Auth">
        <div className="p-4 rounded-xl text-sm leading-7"
          style={{ background: 'rgba(126,232,162,0.06)', border: '1px solid rgba(126,232,162,0.15)', color: 'var(--accent-green)', fontFamily: 'var(--font-display)', fontSize: 12 }}>
          ✓ Auth: {user?.ltcAddress ? 'LTC wallet + email' : 'Email / password'}<br />
          ✓ Sessions: JWT · 7-day expiry · httpOnly cookie<br />
          ✓ Nonces: single-use · 5-min TTL<br />
          ✓ Payments: 3 confirmations required
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Account">
        <button
          onClick={logout}
          className="ls-btn-outline w-full text-sm"
          style={{ color: 'var(--accent-red)', borderColor: 'rgba(255,107,157,0.3)' }}>
          Sign Out
        </button>
      </Section>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="text-xs font-bold uppercase tracking-widest mb-4"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
        {title}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}
