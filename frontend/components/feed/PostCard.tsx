'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Avatar } from '@/components/ui/Avatar'
import { SubscribeModal } from '@/components/subscription/SubscribeModal'
import { TipModal } from '@/components/subscription/TipModal'
import { timeAgo, formatLtc } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'

function renderContent(text: string) {
  return text.split(/(\s+)/).map((word, i) => {
    if (word.startsWith('#'))
      return <span key={i} style={{ color: 'var(--accent-cyan)', cursor: 'pointer' }}>{word}</span>
    if (word.startsWith('@'))
      return <span key={i} style={{ color: 'var(--accent-green)', cursor: 'pointer' }}>{word}</span>
    return word
  })
}

export function PostCard({ post }: { post: any }) {
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [showTip, setShowTip] = useState(false)

  // Bug fix: keep liked state in sync with server, don't rely on optimistic only
  const [liked, setLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post._count?.likes ?? 0)

  const likeMutation = useMutation({
    mutationFn: () => api.toggleLike(post.id),
    onMutate: () => {
      // Optimistic update
      setLiked((l: boolean) => !l)
      setLikesCount((c: number) => liked ? c - 1 : c + 1)
    },
    onSuccess: (data: any) => {
      // Confirm with server response — prevents disappearing likes
      setLiked(data.liked)
    },
    onError: () => {
      // Revert on error
      setLiked((l: boolean) => !l)
      setLikesCount((c: number) => liked ? c + 1 : c - 1)
    },
  })

  const author = post.author
  if (!author) return null

  const commentsCount = post.commentsCount ?? post._count?.comments ?? 0

  return (
    <>
      <article style={{
        display: 'flex', gap: 12, padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        transition: 'background 140ms',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,93,157,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

        <Link href={`/${author.username}`} style={{ flexShrink: 0 }}>
          <Avatar name={author.displayName || author.username} size={40} />
        </Link>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <Link href={`/${author.username}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none' }}>
              {author.displayName || author.username}
            </Link>
            {author.isVerified && <span style={{ color: 'var(--accent-blue-lt)', fontSize: 13 }}>✓</span>}
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>@{author.username}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{timeAgo(post.createdAt)}</span>
          </div>

          {/* Premium badge */}
          {post.isPremium && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, marginBottom: 6,
              padding: '2px 8px', borderRadius: 6,
              background: 'rgba(247,147,26,0.1)', color: 'var(--accent-orange)',
              border: '1px solid rgba(247,147,26,0.25)',
            }}>🔒 Premium</div>
          )}

          {/* Content */}
          {!post.isLocked ? (
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {renderContent(post.content)}
            </p>
          ) : (
            <>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 10 }}>
                {post.content}…
              </p>
              <div style={{
                borderRadius: 14, padding: '16px', textAlign: 'center',
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🔒</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Premium Content</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Subscribe to {author.displayName || author.username} to unlock
                </div>
                <button onClick={() => setShowSubscribe(true)}
                  style={{
                    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: 'var(--accent-orange)', color: '#fff', border: 'none', cursor: 'pointer',
                  }}>
                  Subscribe — {formatLtc(author.subscriptionPrice || 0)}/mo
                </button>
              </div>
            </>
          )}

          {/* Tags */}
          {!post.isLocked && post.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {post.tags.map((t: string) => (
                <span key={t} style={{
                  fontSize: 12, padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(56,189,248,0.08)', color: 'var(--accent-cyan)',
                  border: '1px solid rgba(56,189,248,0.2)',
                }}>#{t}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 10, marginLeft: -8 }}>
            {/* Like */}
            <button
              onClick={() => me && !likeMutation.isPending && likeMutation.mutate()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8, fontSize: 13,
                color: liked ? 'var(--accent-red)' : 'var(--text-muted)',
                background: 'transparent', border: 'none', cursor: me ? 'pointer' : 'default',
                transition: 'color 150ms',
              }}>
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likesCount}</span>
            </button>

            {/* Comment — links to post detail */}
            <Link href={`/post/${post.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8, fontSize: 13,
                color: 'var(--text-muted)', textDecoration: 'none',
                transition: 'color 150ms',
              }}>
              <span>💬</span>
              <span>{commentsCount}</span>
            </Link>

            {/* Tip */}
            {me && me.username !== author.username && (
              <button onClick={() => setShowTip(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 8, fontSize: 13,
                  color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer',
                }}>
                <span>⚡</span>
                {parseFloat(post.tipsTotal || 0) > 0 && (
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-orange)', fontSize: 11 }}>
                    {parseFloat(post.tipsTotal).toFixed(3)} LTC
                  </span>
                )}
              </button>
            )}

            <button style={{
              marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, fontSize: 13,
              color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer',
            }}>🔁</button>
          </div>
        </div>
      </article>

      {showSubscribe && <SubscribeModal creator={author} onClose={() => setShowSubscribe(false)} />}
      {showTip && <TipModal post={post} author={author} onClose={() => setShowTip(false)} />}
    </>
  )
}
