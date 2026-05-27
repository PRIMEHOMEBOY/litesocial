'use client'
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
import { CreatorTierSection } from '@/components/creator/CreatorTierSection'
import { z } from 'zod'

type FormData = z.infer<typeof UpdateUserSchema>

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore()
  const [saved, setSaved] = useState(false)
  const [serverError, setServerError] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showEarningsLocal, setShowEarningsLocal] = useState((user as any)?.showEarnings !== false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      payoutAddress: user?.payoutAddress || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.updateMe(data),
    onSuccess: (updated: any) => {
      updateUser(updated)
      setSaved(true)
      setServerError('')
      setTimeout(() => setSaved(false), 3000)
    },
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

  const onSubmit = (data: FormData) => {
    mutation.mutate({ ...data, showEarnings: showEarningsLocal })
  }

  const avatarIpfsHash = (user as any)?.avatarIpfsHash
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

  return (
    <>
      <PageHeader title="Settings" />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile */}
        <Section title="Profile">
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#345D9D,#4a80d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', border: '2px solid var(--border)' }}>
              {avatarIpfsHash
                ? <img src={`${gateway}/ipfs/${avatarIpfsHash}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : (user?.displayName || user?.username || '?')[0].toUpperCase()
              }
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: avatarUploading ? 'not-allowed' : 'pointer', opacity: avatarUploading ? 0.6 : 1 }}>
                {avatarUploading ? '⏳ Uploading…' : '📷 Change Photo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={avatarUploading} />
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>JPG, PNG · Max 10MB</div>
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

        {/* Creator Setup */}
        <Section title="Creator Setup">
          <FormField label="Payout LTC Address" error={errors.payoutAddress?.message}>
            <input {...register('payoutAddress')} className="ls-input" placeholder="LKx2Bv9mR4PdQ3..." style={{ fontFamily: 'var(--font-display)', fontSize: 12 }} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Subscriber payments go directly here. 0% platform fee.
            </div>
          </FormField>

          {/* Show earnings toggle — fully functional */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}
            onClick={() => setShowEarningsLocal(v => !v)}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>Show earnings on profile</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {showEarningsLocal ? 'Other users can see your total LTC earned' : 'Your earnings are hidden from others'}
              </div>
            </div>
            {/* Toggle switch */}
            <div style={{ position: 'relative', width: 46, height: 26, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 13, background: showEarningsLocal ? 'var(--accent-blue)' : 'var(--border)', transition: 'background 200ms' }} />
              <div style={{ position: 'absolute', top: 3, left: showEarningsLocal ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </div>
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

      {/* Become a Creator */}
      <CreatorTierSection />

      {/* Link Wallet */}
      <LinkWalletSection />

      {/* Account */}
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
    <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', marginBottom: 16 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
}
