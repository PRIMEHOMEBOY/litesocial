'use client'
// components/ui/Modal.tsx
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Modal({
  title,
  onClose,
  children,
  maxWidth = 480,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            width: '100%',
            maxWidth,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
          <div className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              ✕
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
