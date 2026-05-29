'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { RegisterSchema } from '@/lib/schemas'
import { FormField } from '@/components/ui/FormField'
import { EyeOpenIcon, EyeClosedIcon } from '@/components/ui/Icons'

type FormData = z.infer<typeof RegisterSchema>

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(RegisterSchema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      const res = await api.register(data) as any
      setUser(res.user)
      setSuccess(true)
      setTimeout(() => router.push('/home'), 1500)
    } catch (e: any) {
      setServerError(e.message || 'Registration failed')
    }
  }

  if (success) return (
    <div style={{ textAlign: 'center', padding: '12px 0' }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-display)' }}>Account Created!</h2>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Check your email to verify. Redirecting…</p>
    </div>
  )

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
        Create account
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Already have one?{' '}
        <Link href="/login" style={{ color: 'var(--accent-blue-lt)' }}>Sign in</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Username" error={errors.username?.message}>
            <input
              {...register('username')}
              placeholder="satoshi_lite"
              className="ls-input"
              autoComplete="username"
            />
          </FormField>
          <FormField label="Display Name" error={errors.displayName?.message}>
            <input
              {...register('displayName')}
              placeholder="Satoshi Lite"
              className="ls-input"
              autoComplete="name"
            />
          </FormField>
        </div>

        <FormField label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="you@email.com"
            className="ls-input"
            autoComplete="email"
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <div style={{ position: 'relative' }}>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className="ls-input"
              autoComplete="new-password"
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-elevated)',
                borderLeft: '1px solid var(--border)',
                borderRadius: '0 10px 10px 0',
                cursor: 'pointer', border: 'none',
                color: 'var(--text-secondary)',
                transition: 'color 160ms, background 160ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#4a80d4'
                e.currentTarget.style.background = 'rgba(74,128,212,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.background = 'var(--bg-elevated)'
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword
                ? <EyeClosedIcon size={20} color="currentColor" strokeWidth={2} />
                : <EyeOpenIcon size={20} color="currentColor" strokeWidth={2} />
              }
            </button>
          </div>
        </FormField>

        {serverError && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13 }}>
            {serverError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="ls-btn-primary" style={{ marginTop: 4 }}>
          {isSubmitting ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <Link href="/connect-wallet" className="ls-btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
        🔗 Continue with LTC Wallet Only
      </Link>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
        You can link a Litecoin wallet later from Settings.
      </p>
    </>
  )
}
