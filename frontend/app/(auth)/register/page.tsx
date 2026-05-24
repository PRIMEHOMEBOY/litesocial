'use client'
// app/(auth)/register/page.tsx
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

type FormData = z.infer<typeof RegisterSchema>

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(RegisterSchema) })

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

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Account Created!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Check your email to verify. Redirecting to your feed…
        </p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Create account</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Already have one?{' '}
        <Link href="/login" style={{ color: 'var(--accent-purple)' }}>Sign in</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
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
          <input
            {...register('password')}
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            className="ls-input"
            autoComplete="new-password"
          />
        </FormField>

        {serverError && (
          <div className="text-sm px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,107,157,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,107,157,0.2)' }}>
            {serverError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="ls-btn-primary mt-2">
          {isSubmitting ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <Link href="/connect-wallet" className="ls-btn-outline flex items-center justify-center gap-2">
        🔗 Continue with LTC Wallet Only
      </Link>

      <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
        You can link a Litecoin wallet later from Settings.
      </p>
    </>
  )
}
