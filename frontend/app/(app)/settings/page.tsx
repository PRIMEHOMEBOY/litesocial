'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { UpdateUserSchema } from '@/lib/schemas'
import { PageHeader } from '@/components/layout/PageHeader'
import { FormField } from '@/components/ui/FormField'
import { LinkWalletSection } from '@/components/wallet/LinkWalletSection'
import { CreatorTierSection } from '@/components/creator/CreatorTierSection'
import { z } from 'zod'

type FormData = z.infer<typeof UpdateUserSchema>

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      payoutAddress: user?.payoutAddress || '',
      showEarnings: (user as any)?.showEarnings !== false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.updateMe(data),
    onSuccess: (updated: any) => { updateUser(updated); setSaved(true); setServerError(''); setTimeout(() => setSaved(false), 3000) },
    onError: (e: any) => setServerError(e.message),
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const result = await api.uploadMedia(file) as any
      await api.updateMe({ avatarIpfsHash: result.hash } as any)
      updateUser({ avatarIpfsHash: result.hash })
    } catch (err: any) {
      setServerError('Avatar upload failed: ' + err.message)
    } finally {
      setAvatarUploading(false)
    }
  }

  const logout = useAuthStore((s) => s.logout)

  return (
    <>
      <PageHeader title="Settings" />

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        {/* Profile */}
        <Section title="Profile">
          {/* Avatar upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
              {(user as any)?.avatarIpfsHash ? (
                <img src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}/ipfs/${(user as any).avatarIpfsHash}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, background: 'linear-gradient(135deg,#345D9D,#4a80d4)', color: '#fff' }}>
                  {(user?.displayName || user?.username || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {avatarUploading ? 'Uploading…' : '📷 Change Photo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG, GIF · Max 10MB</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Display Name" error={errors.displayName?.message}>
              <input {...register('displayName')} className="ls-input" />
            </FormField>
            <FormField label="Username" error={errors.username?.message}>
              <input {...register('username')} className="ls-input" />
            </FormField>
          </div>
          <FormField label="Bio" error={errors.bio?.message}>
            <textarea {...register('bio')} rows={3} className="ls-input" style={{ resize: 'none' }} placeholder="Tell people about yourself…" />
          </FormField>
        </Section>

        {/* Creator Setup — payout address only */}
        <Section title="Creator Setup">
          <FormField label="Payout LTC Address" error={errors.payoutAddress?.message}>
            <input {...register('payoutAddress')} className="ls-input" placeholder="LKx2Bv9mR4PdQ3..." style={{ fontFamily: 'var(--font-display)', fontSize: 12 }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Subscriber payments go directly here. 0% platform fee.</div>
          </FormField>

          {/* Show earnings toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Show earnings on profile</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Other users can see your total LTC earned</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
              <input type="checkbox" {...register('showEarnings')} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'var(--accent-blue)', transition: '200ms' }} />
            </label>
          </div>
        </Section>

        {serverError && (
          <div style={{ margin: '0 20px 12px', padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13 }}>
            {serverError}
          </div>
        )}

        <div style={{ padding: '0 20px 20px' }}>
          <button type="submit" disabled={isSubmitting} className="ls-btn-primary">
            {isSubmitting ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Creator Tier — become a creator */}
      <CreatorTierSection />

      {/* Wallet linking */}
      <LinkWalletSection />

      {/* Sign out */}
      <Section title="Account">
        <button onClick={logout} className="ls-btn-outline" style={{ color: 'var(--accent-red)', borderColor: 'rgba(248,113,113,0.3)' }}>
          Sign Out
        </button>
      </Section>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}
