'use client'
// components/feed/PostComposer.tsx
import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'

const MAX = 2800

interface Props {
  onSubmit: (data: { content: string; isPremium: boolean; mediaHashes?: string[] }) => void
  isSubmitting?: boolean
}

export function PostComposer({ onSubmit, isSubmitting }: Props) {
  const user = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const over = content.length > MAX
  const charPct = content.length / MAX

  const handleSubmit = () => {
    if (!content.trim() || over || isSubmitting) return
    onSubmit({ content, isPremium })
    setContent('')
    setIsPremium(false)
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`
  }

  if (!user) return null

  return (
    <div className="flex gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <Avatar name={user.displayName || user.username} size={40} />
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); autoResize() }}
          placeholder="What's happening in the Litecoin ecosystem?"
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            resize: 'none',
            lineHeight: 1.55,
          }}
        />
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg text-base transition-colors" title="Add image"
              style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>🖼️</button>
            <button
              onClick={() => setIsPremium((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: isPremium ? 'rgba(247,147,26,0.12)' : 'transparent',
                border: `1px solid ${isPremium ? 'rgba(247,147,26,0.3)' : 'transparent'}`,
                color: isPremium ? 'var(--accent-orange)' : 'var(--text-muted)',
              }}>
              🔒 {isPremium ? 'Premium on' : 'Premium'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{
              fontFamily: 'var(--font-display)',
              color: over ? 'var(--accent-red)' : charPct > 0.9 ? 'var(--accent-orange)' : 'var(--text-muted)',
            }}>
              {content.length}/{MAX}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || over || isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity"
              style={{
                background: 'var(--accent-purple)',
                color: '#fff',
                opacity: (!content.trim() || over || isSubmitting) ? 0.4 : 1,
                border: 'none',
                cursor: (!content.trim() || over || isSubmitting) ? 'not-allowed' : 'pointer',
              }}>
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
