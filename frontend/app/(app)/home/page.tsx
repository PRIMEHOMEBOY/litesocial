'use client'
// app/(app)/home/page.tsx
import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PostCard } from '@/components/feed/PostCard'
import { PostComposer } from '@/components/feed/PostComposer'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/useAuthStore'

export default function HomePage() {
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you')
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed', tab],
    queryFn: ({ pageParam }) => api.getFeed(pageParam as string | undefined, tab) as Promise<{ posts: any[]; nextCursor: string | null }>,
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const createPostMutation = useMutation({
    mutationFn: (post: { content: string; isPremium: boolean; mediaHashes?: string[] }) =>
      api.createPost(post),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  })

  const posts = data?.pages.flatMap((p) => p.posts) ?? []

  return (
    <>
      <PageHeader title="Home">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {(['for-you', 'following'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'var(--accent-purple)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)',
              }}>
              {t === 'for-you' ? 'For You' : 'Following'}
            </button>
          ))}
        </div>
      </PageHeader>

      <PostComposer onSubmit={(data) => createPostMutation.mutate(data)} isSubmitting={createPostMutation.isPending} />

      {isLoading && (
        <div className="flex flex-col gap-0">
          {[...Array(3)].map((_, i) => <PostSkeleton key={i} />)}
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasNextPage && (
        <div className="p-4 flex justify-center">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
            className="px-6 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <div className="text-4xl mb-4">🌐</div>
          <p className="font-semibold">
            {tab === 'following' ? 'Follow some creators to see their posts' : 'No posts yet — be the first!'}
          </p>
        </div>
      )}
    </>
  )
}

function PostSkeleton() {
  return (
    <div className="flex gap-3 p-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 w-32 rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-4 w-full rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
        <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
      </div>
    </div>
  )
}
