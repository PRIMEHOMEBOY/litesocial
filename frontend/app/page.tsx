'use client'
// app/page.tsx
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const { user, isHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && user) router.replace('/home')
  }, [user, isHydrated, router])

  const features = [
    { icon: '🔐', title: 'Wallet or Email Auth', desc: 'Sign up with email and link your LTC wallet later — or go pure Web3 from day one.' },
    { icon: '💰', title: '0% Platform Fee', desc: '100% of subscription revenue goes directly to creators. Litecoin network fees only.' },
    { icon: '📦', title: 'IPFS Content', desc: 'Posts stored on IPFS — censorship-resistant and verifiable forever.' },
    { icon: '⚡', title: 'Instant LTC Tips', desc: 'Tip any post in Litecoin. Detected automatically on-chain after 3 confirmations.' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(155,99,255,0.1) 0%, transparent 60%), var(--bg-base)' }}>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4 mb-8"
      >
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
          style={{ background: 'linear-gradient(135deg, #9b63ff, #f7931a)', fontFamily: 'var(--font-display)', boxShadow: '0 0 80px rgba(155,99,255,0.3)' }}>
          LS
        </div>
        <h1 className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-2px' }}>
          Lite<span style={{ color: 'var(--accent-purple)' }}>Social</span>
        </h1>
        <p className="text-lg max-w-md leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          The decentralized creator economy built on{' '}
          <span style={{ color: 'var(--accent-orange)', fontFamily: 'var(--font-display)' }}>Litecoin</span>.
          No ads. No middlemen. Just creators and their audience.
        </p>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-3 mb-16"
      >
        <Link href="/register"
          className="px-8 py-3.5 rounded-xl font-semibold text-white text-base transition-opacity hover:opacity-85"
          style={{ background: 'var(--accent-purple)', fontFamily: 'var(--font-body)' }}>
          Create Account →
        </Link>
        <Link href="/login"
          className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:border-gray-600"
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Sign In
        </Link>
        <Link href="/connect-wallet"
          className="px-8 py-3.5 rounded-xl font-semibold text-base transition-opacity hover:opacity-85"
          style={{ background: 'transparent', border: '1px solid var(--accent-orange)', color: 'var(--accent-orange)' }}>
          🔗 Connect Wallet Only
        </Link>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full mb-16"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="text-center p-5 rounded-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="font-semibold text-sm mb-2">{f.title}</div>
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Stats */}
      <div className="flex gap-12 mb-10" style={{ color: 'var(--text-secondary)' }}>
        {[['0%', 'Platform Fee'], ['∞', 'Creator Freedom'], ['LTC', 'Native Currency']].map(([num, label]) => (
          <div key={label} className="text-center">
            <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>{num}</div>
            <div className="text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Built on Litecoin mainnet · Content on IPFS · Payments via BlockCypher
      </p>
    </div>
  )
}
