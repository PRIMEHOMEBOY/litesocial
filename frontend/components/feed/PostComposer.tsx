'use client'
import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api-client'

const MAX = 2800

interface Props {
  onSubmit: (data: { content: string; isPremium: boolean; mediaHashes?: string[] }) => void
  isSubmitting?: boolean
}

export function PostComposer({ onSubmit, isSubmitting }: Props) {
  const user = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mediaHashes, setMediaHashes] = useState<string[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const over = content.length > MAX
  const charPct = content.length / MAX

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 280)}px`
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('Max file size is 10MB'); return }
    setUploading(true)
    try {
      const preview = URL.createObjectURL(file)
      setPreviews(p => [...p, preview])
      const result = await api.uploadMedia(file) as any
      setMediaHashes(h => [...h, result.hash])
    } catch (e: any) {
      alert('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeMedia = (i: number) => {
    setPreviews(p => p.filter((_, idx) => idx !== i))
    setMediaHashes(h => h.filter((_, idx) => idx !== i))
  }

  const handleSubmit = () => {
    if (!content.trim() || over || isSubmitting) return
    onSubmit({ content, isPremium, mediaHashes })
    setContent(''); setIsPremium(false); setMediaHashes([]); setPreviews([])
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  if (!user) return null

  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
      <Avatar name={user.displayName || user.username} size={40} />
      <div style={{ flex: 1 }}>
        <textarea ref={textareaRef} value={content}
          onChange={(e) => { setContent(e.target.value); autoResize() }}
          placeholder="Write a post…"
          rows={3}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 15, resize: 'none', lineHeight: 1.55 }}
        />

        {/* Image previews */}
        {previews.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {previews.map((p, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => removeMedia(i)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Image upload */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading || mediaHashes.length >= 4}
              style={{ padding: '6px 8px', borderRadius: 8, background: 'transparent', border: 'none', color: uploading ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 18 }}
              title="Add image">
              {uploading ? '⏳' : '🖼️'}
            </button>
            {/* Premium toggle */}
            <button onClick={() => setIsPremium(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: isPremium ? 'rgba(247,147,26,0.12)' : 'transparent', border: `1px solid ${isPremium ? 'rgba(247,147,26,0.3)' : 'transparent'}`, color: isPremium ? 'var(--accent-orange)' : 'var(--text-muted)', cursor: 'pointer' }}>
              🔒 {isPremium ? 'Premium on' : 'Premium'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: over ? 'var(--accent-red)' : charPct > 0.9 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
              {content.length}/{MAX}
            </span>
            <button onClick={handleSubmit} disabled={!content.trim() || over || isSubmitting}
              style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'var(--accent-blue)', color: '#fff', border: 'none', cursor: !content.trim() || over || isSubmitting ? 'not-allowed' : 'pointer', opacity: !content.trim() || over || isSubmitting ? 0.4 : 1 }}>
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
