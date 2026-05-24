'use client'
// app/(auth)/login/page.tsx
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(LoginSchema) })

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
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Sign in</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        No account?{' '}
        <Link href="/register" style={{ color: 'var(--accent-purple)' }}>Create one free</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            placeholder="Your password"
            className="ls-input"
            autoComplete="current-password"
          />
        </FormField>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div className="text-sm px-3 py-2 rounded-lg"
            style={{ background: 'rgba(255,107,157,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(255,107,157,0.2)' }}>
            {serverError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="ls-btn-primary mt-1">
          {isSubmitting ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      <Link href="/connect-wallet" className="ls-btn-outline flex items-center justify-center gap-2">
        🔗 Sign in with LTC Wallet
      </Link>
    </>
  )
}
