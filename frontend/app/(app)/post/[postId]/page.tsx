'use client'
// app/(app)/post/[postId]/page.tsx
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PostCard } from '@/components/feed/PostCard'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/useAuthStore'
import { useState } from 'react'
import { timeAgo } from '@/lib/utils'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const router = useRouter()
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [comment, setComment] = useState('')

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => api.getPost(postId) as Promise<any>,
  })

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => api.getComments(postId, pageParam as string | undefined) as Promise<{ comments: any[]; nextCursor: string | null }>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const commentMutation = useMutation({
    mutationFn: () => api.addComment(postId, comment),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['comments', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  const comments = data?.pages.flatMap((p) => p.comments) ?? []

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4"
        style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.back()}
          className="text-xl p-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          ←
        </button>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>Post</h1>
      </div>

      {/* Post */}
      {postLoading ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>
      ) : post ? (
        <PostCard post={post} />
      ) : (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Post not found</div>
      )}

      {/* Comment composer */}
      {me && (
        <div className="px-5 py-4 flex gap-3" style={{ borderTop: '4px solid var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
          <Avatar name={me.displayName || me.username} size={36} />
          <div className="flex-1">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 15,
                resize: 'none',
                lineHeight: 1.5,
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => commentMutation.mutate()}
                disabled={!comment.trim() || commentMutation.isPending}
                className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-opacity"
                style={{
                  background: 'var(--accent-purple)',
                  color: '#fff',
                  border: 'none',
                  opacity: !comment.trim() || commentMutation.isPending ? 0.4 : 1,
                  cursor: !comment.trim() || commentMutation.isPending ? 'not-allowed' : 'pointer',
                }}>
                {commentMutation.isPending ? 'Posting…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Avatar name={c.author?.displayName || c.author?.username || '?'} size={36} />
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold">{c.author?.displayName || c.author?.username}</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>@{c.author?.username}</span>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-sm leading-relaxed">{c.content}</p>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div className="p-4 flex justify-center">
          <button onClick={() => fetchNextPage()}
            className="px-6 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Load more comments
          </button>
        </div>
      )}

      {!postLoading && comments.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm">No replies yet — be the first!</p>
        </div>
      )}
    </>
  )
}
