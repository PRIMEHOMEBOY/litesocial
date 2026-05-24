'use client'
// app/(app)/explore/page.tsx
import { useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PostCard } from '@/components/feed/PostCard'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { PageHeader } from '@/components/layout/PageHeader'

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [tab, setTab] = useState<'trending' | 'creators'>('trending')

  const { data: tagsData } = useQuery({
    queryKey: ['trending-tags'],
    queryFn: () => api.getTrendingTags() as Promise<{ tags: { name: string; count: number }[] }>,
    staleTime: 60_000,
  })

  const { data: creatorsData } = useQuery({
    queryKey: ['top-creators'],
    queryFn: () => api.getTopCreators() as Promise<{ creators: any[] }>,
    staleTime: 60_000,
  })

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['explore-posts', activeTag],
    queryFn: ({ pageParam }) =>
      api.getExplore('24h', pageParam as string | undefined) as Promise<{ posts: any[]; nextCursor: string | null }>,
    initialPageParam: undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const posts = data?.pages.flatMap((p) => p.posts) ?? []
  const tags = tagsData?.tags ?? []
  const creators = creatorsData?.creators ?? []

  const filteredPosts = query
    ? posts.filter(
        (p) =>
          p.content?.toLowerCase().includes(query.toLowerCase()) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : posts

  return (
    <>
      <PageHeader title="Explore" />

      {/* Search */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, people, #hashtags…"
            className="ls-input pl-10"
          />
        </div>
      </div>

      {/* Trending tags */}
      {!query && (
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            Trending
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.name}
                onClick={() => setActiveTag(activeTag === t.name ? null : t.name)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: activeTag === t.name ? 'rgba(155,99,255,0.2)' : 'rgba(155,99,255,0.08)',
                  border: `1px solid ${activeTag === t.name ? 'var(--accent-purple)' : 'rgba(155,99,255,0.2)'}`,
                  color: 'var(--accent-purple)',
                }}>
                #{t.name}
                <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab switcher */}
      {!query && (
        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          {(['trending', 'creators'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3.5 text-sm font-semibold transition-all capitalize"
              style={{
                color: tab === t ? 'var(--accent-purple)' : 'var(--text-secondary)',
                borderBottom: tab === t ? '2px solid var(--accent-purple)' : '2px solid transparent',
              }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'creators' && !query ? (
        <div className="p-4 flex flex-col gap-2">
          {creators.map((c) => <CreatorCard key={c.id} creator={c} />)}
        </div>
      ) : (
        <>
          {filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}
          {isLoading && (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>
          )}
          {hasNextPage && !query && (
            <div className="p-4 flex justify-center">
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                className="px-6 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                {isFetchingNextPage ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
          {!isLoading && filteredPosts.length === 0 && (
            <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
              <div className="text-4xl mb-3">🔍</div>
              <p>{query ? `No results for "${query}"` : 'Nothing trending right now'}</p>
            </div>
          )}
        </>
      )}
    </>
  )
}
