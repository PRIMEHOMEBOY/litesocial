'use client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PostCard } from '@/components/feed/PostCard'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/useAuthStore'
import { useState } from 'react'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'

// Single comment with nested reply support
function Comment({ comment, postId, depth = 0 }: { comment: any; postId: string; depth?: number }) {
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplies, setShowReplies] = useState(false)

  // Load replies for this comment
  const { data: repliesData, isLoading: repliesLoading } = useQuery({
    queryKey: ['replies', comment.id],
    queryFn: () => api.getComments(postId) as Promise<{ comments: any[] }>,
    enabled: false, // only load when expanded
  })

  const replyMutation = useMutation({
    mutationFn: () => api.addComment(postId, `@${comment.author?.username} ${replyText}`),
    onSuccess: () => {
      setReplyText('')
      setShowReply(false)
      qc.invalidateQueries({ queryKey: ['comments', postId] })
      qc.invalidateQueries({ queryKey: ['post', postId] })
    },
  })

  return (
    <div style={{ paddingLeft: depth > 0 ? 44 : 0 }}>
      <div style={{
        display: 'flex', gap: 12, padding: '12px 18px',
        borderBottom: '1px solid var(--border)',
        borderLeft: depth > 0 ? '2px solid rgba(52,93,157,0.3)' : 'none',
        marginLeft: depth > 0 ? 18 : 0,
      }}>
        <Link href={`/${comment.author?.username}`} style={{ flexShrink: 0 }}>
          <Avatar name={comment.author?.displayName || comment.author?.username || '?'} size={36} />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <Link href={`/${comment.author?.username}`} style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', textDecoration: 'none' }}>
              {comment.author?.displayName || comment.author?.username}
            </Link>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{comment.author?.username}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{timeAgo(comment.createdAt)}</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
            {comment.content}
          </p>
          {/* Reply button */}
          {me && depth < 2 && (
            <button
              onClick={() => setShowReply(!showReply)}
              style={{
                marginTop: 6, fontSize: 12, color: 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
              {showReply ? 'Cancel' : '↩ Reply'}
            </button>
          )}
        </div>
      </div>

      {/* Reply composer */}
      {showReply && me && (
        <div style={{
          display: 'flex', gap: 10, padding: '10px 18px 10px',
          paddingLeft: depth > 0 ? 62 : 62,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(52,93,157,0.04)',
        }}>
          <Avatar name={me.displayName || me.username} size={30} />
          <div style={{ flex: 1 }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to @${comment.author?.username}…`}
              rows={2}
              style={{
                width: '100%', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: 10,
                padding: '8px 12px', color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 13,
                resize: 'none', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                onClick={() => replyMutation.mutate()}
                disabled={!replyText.trim() || replyMutation.isPending}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: 'var(--accent-blue)', color: '#fff', border: 'none',
                  cursor: !replyText.trim() || replyMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: !replyText.trim() || replyMutation.isPending ? 0.4 : 1,
                }}>
                {replyMutation.isPending ? 'Posting…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api.getComments(postId, pageParam) as Promise<{ comments: any[]; nextCursor: string | null }>,
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
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        background: 'rgba(6,10,16,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={() => router.back()}
          style={{ fontSize: 20, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          ←
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Post</h1>
      </div>

      {/* Post */}
      {postLoading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      ) : post ? (
        <PostCard post={post} />
      ) : (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Post not found</div>
      )}

      {/* Comment composer */}
      {me && (
        <div style={{
          display: 'flex', gap: 12, padding: '14px 18px',
          borderTop: '3px solid var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
        }}>
          <Avatar name={me.displayName || me.username} size={36} />
          <div style={{ flex: 1 }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              style={{
                width: '100%', background: 'transparent',
                border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                fontSize: 14, resize: 'none', lineHeight: 1.55,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => commentMutation.mutate()}
                disabled={!comment.trim() || commentMutation.isPending}
                style={{
                  padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: 'var(--accent-blue)', color: '#fff', border: 'none',
                  cursor: !comment.trim() || commentMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: !comment.trim() || commentMutation.isPending ? 0.4 : 1,
                }}>
                {commentMutation.isPending ? 'Posting…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments with nested reply support */}
      {comments.map((c) => (
        <Comment key={c.id} comment={c} postId={postId} depth={0} />
      ))}

      {hasNextPage && (
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => fetchNextPage()}
            style={{
              padding: '8px 24px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
            }}>
            Load more comments
          </button>
        </div>
      )}

      {!postLoading && comments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
          <p style={{ fontSize: 14 }}>No replies yet — be the first!</p>
        </div>
      )}
    </>
  )
}
