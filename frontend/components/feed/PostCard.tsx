'use client'
// components/feed/PostCard.tsx
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
      return <span key={i} style={{ color: 'var(--accent-purple)', cursor: 'pointer' }}>{word}</span>
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
  const [liked, setLiked] = useState(post.isLiked)
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post._count?.likes ?? 0)

  const likeMutation = useMutation({
    mutationFn: () => api.toggleLike(post.id),
    onMutate: () => {
      setLiked((l: boolean) => !l)
      setLikesCount((c: number) => liked ? c - 1 : c + 1)
    },
    onError: () => {
      setLiked((l: boolean) => !l)
      setLikesCount((c: number) => liked ? c + 1 : c - 1)
    },
  })

  const author = post.author
  if (!author) return null

  const commentsCount = post.commentsCount ?? post._count?.comments ?? 0

  return (
    <>
      <article
        className="flex gap-3 px-5 py-4 transition-colors"
        style={{ borderBottom: '1px solid var(--border)', cursor: 'default' }}>
        <Link href={`/${author.username}`} className="flex-shrink-0">
          <Avatar name={author.displayName || author.username} size={40} />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <Link href={`/${author.username}`} className="font-semibold text-sm hover:underline">
              {author.displayName || author.username}
            </Link>
            {author.isVerified && <span style={{ color: 'var(--accent-purple)', fontSize: 13 }}>✓</span>}
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{author.username}</span>
            <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.createdAt)}</span>
          </div>

          {/* Premium badge */}
          {post.isPremium && (
            <div className="inline-flex items-center gap-1 text-xs font-semibold mb-2 px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(247,147,26,0.12)', color: 'var(--accent-orange)', border: '1px solid rgba(247,147,26,0.25)' }}>
              🔒 Premium
            </div>
          )}

          {/* Content */}
          {!post.isLocked ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{renderContent(post.content)}</p>
          ) : (
            <>
              <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                {post.content}…
              </p>
              <div className="rounded-xl p-5 text-center"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="text-2xl mb-2">🔒</div>
                <div className="font-semibold text-sm mb-1">Premium Content</div>
                <div className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Subscribe to {author.displayName || author.username} to unlock
                </div>
                <button
                  onClick={() => setShowSubscribe(true)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--accent-orange)', color: '#fff' }}>
                  Subscribe — {formatLtc(author.subscriptionPrice || 0)}/mo
                </button>
              </div>
            </>
          )}

          {/* Tags */}
          {!post.isLocked && post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map((t: string) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(155,99,255,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(155,99,255,0.2)' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-3 -ml-2">
            {/* Like */}
            <button
              onClick={() => me && likeMutation.mutate()}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: liked ? 'var(--accent-red)' : 'var(--text-muted)', background: 'transparent', border: 'none' }}>
              <span>{liked ? '❤️' : '🤍'}</span>
              <span>{likesCount}</span>
            </button>

            {/* Comment */}
            <Link href={`/post/${post.id}`}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              <span>💬</span>
              <span>{commentsCount}</span>
            </Link>

            {/* Tip */}
            {me && me.username !== author.username && (
              <button
                onClick={() => setShowTip(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
                <span>⚡</span>
                {parseFloat(post.tipsTotal || 0) > 0 && (
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-orange)', fontSize: 12 }}>
                    {parseFloat(post.tipsTotal).toFixed(3)} LTC
                  </span>
                )}
              </button>
            )}

            {/* Repost */}
            <button
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm transition-colors ml-auto"
              style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none' }}>
              <span>🔁</span>
            </button>
          </div>
        </div>
      </article>

      {showSubscribe && <SubscribeModal creator={author} onClose={() => setShowSubscribe(false)} />}
      {showTip && <TipModal post={post} author={author} onClose={() => setShowTip(false)} />}
    </>
  )
}
