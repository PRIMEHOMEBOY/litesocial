'use client'
import { useState } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PostCard } from '@/components/feed/PostCard'
import { CreatorCard } from '@/components/creator/CreatorCard'
import { PageHeader } from '@/components/layout/PageHeader'

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [tab, setTab] = useState<'trending'|'creators'>('trending')

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

  // User search
  const { data: userSearchData } = useQuery({
    queryKey: ['user-search', query],
    queryFn: () => api.searchUsers(query) as Promise<{ users: any[] }>,
    enabled: query.length >= 1,
    staleTime: 5_000,
  })

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['explore-posts', activeTag],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api.getExplore('24h', pageParam) as Promise<{ posts: any[]; nextCursor: string | null }>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const posts = data?.pages.flatMap((p) => p.posts) ?? []
  const tags = tagsData?.tags ?? []
  const creators = creatorsData?.creators ?? []
  const userResults = userSearchData?.users ?? []

  const filteredPosts = query
    ? posts.filter(p => p.content?.toLowerCase().includes(query.toLowerCase()) || p.tags?.some((t: string) => t.toLowerCase().includes(query.toLowerCase())))
    : posts

  return (
    <>
      <PageHeader title="Explore" />

      {/* Search — icon fixed outside input so it doesn't overlap text */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--bg-elevated)', border: `1px solid ${query ? 'var(--accent-blue-lt)' : 'var(--border)'}`, transition: 'border-color 160ms' }}>
          <span style={{ fontSize: 15, color: 'var(--text-muted)', flexShrink: 0 }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search posts, people, #hashtags…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 14 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
          )}
        </div>
      </div>

      {/* User search results */}
      {query && userResults.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '.08em', padding: '10px 18px 6px' }}>People</div>
          {userResults.map(u => (
            <a key={u.id} href={`/${u.username}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', textDecoration: 'none', borderBottom: '1px solid var(--border)', transition: 'background 140ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,93,157,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#345D9D,#4a80d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(u.displayName || u.username)[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {u.displayName || u.username}
                  {u.isVerified && <img src="/ltc-logo.svg" alt="✓" style={{ width: 14, height: 14 }} />}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{u.username}</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Trending tags */}
      {!query && (
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Trending</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map(t => (
              <button key={t.name} onClick={() => setActiveTag(activeTag === t.name ? null : t.name)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 160ms', background: activeTag === t.name ? 'rgba(56,189,248,0.15)' : 'var(--bg-elevated)', border: `1px solid ${activeTag === t.name ? 'var(--accent-cyan)' : 'var(--border)'}`, color: activeTag === t.name ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                #{t.name} <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab switcher */}
      {!query && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {(['trending','creators'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: 'none', textTransform: 'capitalize', color: tab === t ? 'var(--accent-blue-lt)' : 'var(--text-secondary)', borderBottom: tab === t ? '2px solid var(--accent-blue-lt)' : '2px solid transparent', transition: 'all 160ms' }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === 'creators' && !query ? (
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {creators.map(c => <CreatorCard key={c.id} creator={c} />)}
        </div>
      ) : (
        <>
          {filteredPosts.map(post => <PostCard key={post.id} post={post} />)}
          {isLoading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>}
          {hasNextPage && !query && (
            <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => fetchNextPage()} style={{ padding: '8px 24px', borderRadius: 10, fontSize: 13, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                Load more
              </button>
            </div>
          )}
          {!isLoading && filteredPosts.length === 0 && query && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p>No results for "{query}"</p>
            </div>
          )}
        </>
      )}
    </>
  )
}
