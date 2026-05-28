'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { LoginSchema } from '@/lib/schemas'
import { FormField } from '@/components/ui/FormField'

type FormData = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError('')
    try {
      const res = await api.login(data) as any
      setUser(res.user)
      router.push('/home')
    } catch (e: any) {
      setServerError(e.message || 'Login failed')
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Sign in</h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
        No account? <Link href="/register" style={{ color: 'var(--accent-blue-lt)' }}>Create one free</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Email" error={errors.email?.message}>
          <input {...register('email')} type="email" placeholder="you@email.com" className="ls-input" autoComplete="email" />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <div style={{ position: 'relative' }}>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              className="ls-input"
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)', lineHeight: 1 }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
          <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13 }}>
            {serverError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="ls-btn-primary">
          {isSubmitting ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <Link href="/connect-wallet" className="ls-btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
        🔗 Sign in with LTC Wallet
      </Link>
    </>
  )
}
