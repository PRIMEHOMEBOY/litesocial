'use client'
// app/(app)/[username]/page.tsx
import { useParams } from 'next/navigation'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { PostCard } from '@/components/feed/PostCard'
import { SubscribeModal } from '@/components/subscription/SubscribeModal'
import { useState } from 'react'
import { formatLtc, truncateAddress, getIpfsUrl } from '@/lib/utils'
import Image from 'next/image'

const TIER_LABELS: Record<string, string> = { BASIC: 'Basic', PRO: 'Pro', ELITE: 'Elite', NONE: '' }
const TIER_COLORS: Record<string, string> = {
  BASIC: '#888',
  PRO: 'var(--accent-purple)',
  ELITE: 'var(--accent-orange)',
  NONE: '',
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [showSubscribe, setShowSubscribe] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => api.getUser(username) as Promise<any>,
  })

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['user-posts', username],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api.getUserPosts(username, pageParam as string | undefined) as Promise<{
        posts: any[]
        nextCursor: string | null
      }>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!profile,
  })

  const followMutation = useMutation({
    mutationFn: () => api.toggleFollow(username),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user', username] }),
  })

  const posts = data?.pages.flatMap((p) => p.posts) ?? []
  const isOwnProfile = me?.username === username

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-36" style={{ background: 'var(--bg-elevated)' }} />
        <div className="p-5">
          <div className="w-16 h-16 rounded-full mb-3" style={{ background: 'var(--border)' }} />
          <div className="h-5 w-32 rounded mb-2" style={{ background: 'var(--border)' }} />
          <div className="h-4 w-64 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
        User not found
      </div>
    )
  }

  const avatarUrl = getIpfsUrl(profile.avatarIpfsHash)
  const bannerUrl = getIpfsUrl(profile.bannerIpfsHash)
  const tierColor = TIER_COLORS[profile.creatorTier] || ''
  const tierLabel = TIER_LABELS[profile.creatorTier] || ''

  return (
    <>
      {/* Banner */}
      <div
        className="h-36 relative overflow-hidden"
        style={{
          background: bannerUrl
            ? undefined
            : 'linear-gradient(135deg, #1a0a3a, #0a1f2e, #1a0a1f)',
        }}>
        {bannerUrl && <Image src={bannerUrl} alt="Banner" fill className="object-cover" />}
      </div>

      {/* Profile info */}
      <div className="px-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-end justify-between -mt-9 mb-3">
          {/* Avatar */}
          <div
            className="w-[72px] h-[72px] rounded-full border-4 flex items-center justify-center text-2xl font-bold overflow-hidden"
            style={{
              borderColor: 'var(--bg-base)',
              background: avatarUrl ? undefined : 'linear-gradient(135deg,#9b63ff,#f7931a)',
            }}>
            {avatarUrl ? (
              <Image src={avatarUrl} alt={profile.displayName} width={72} height={72} className="rounded-full" />
            ) : (
              (profile.displayName?.[0] || profile.username[0]).toUpperCase()
            )}
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => followMutation.mutate()}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: profile.isFollowing ? 'transparent' : 'var(--accent-purple)',
                  border: `1px solid ${profile.isFollowing ? 'var(--border)' : 'var(--accent-purple)'}`,
                  color: profile.isFollowing ? 'var(--text-secondary)' : '#fff',
                  cursor: 'pointer',
                }}>
                {profile.isFollowing ? 'Following ✓' : 'Follow'}
              </button>
              {profile.subscriptionPrice && (
                <button
                  onClick={() => setShowSubscribe(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--accent-orange)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Subscribe
                </button>
              )}
            </div>
          )}
        </div>

        {/* Name + verification */}
        <h1 className="text-xl font-bold flex items-center gap-2">
          {profile.displayName || profile.username}
          {profile.isVerified && <span style={{ color: 'var(--accent-purple)' }}>✓</span>}
          {tierLabel && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{
                background: `${tierColor}18`,
                color: tierColor,
                border: `1px solid ${tierColor}40`,
              }}>
              {tierLabel}
            </span>
          )}
        </h1>

        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
          @{profile.username}
          {profile.ltcAddress && (
            <span className="ml-2" style={{ color: 'var(--text-muted)' }}>
              · {truncateAddress(profile.ltcAddress)}
            </span>
          )}
        </p>

        {profile.bio && (
          <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {profile.bio}
          </p>
        )}

        {/* Stats row */}
        <div className="flex gap-5 mt-4 flex-wrap">
          {[
            { label: 'Posts', value: profile._count?.posts ?? 0 },
            { label: 'Followers', value: (profile._count?.followedBy ?? 0).toLocaleString() },
            { label: 'Following', value: profile._count?.following ?? 0 },
          ].map((s) => (
            <div key={s.label}>
              <span className="font-bold text-sm">{s.value}</span>{' '}
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
            </div>
          ))}
          <div>
            <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>
              {parseFloat(profile.totalEarned || 0).toFixed(2)}
            </span>{' '}
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>LTC earned</span>
          </div>
        </div>

        {/* Subscription price */}
        {profile.subscriptionPrice && (
          <div
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-sm"
            style={{
              background: 'rgba(247,147,26,0.1)',
              border: '1px solid rgba(247,147,26,0.25)',
              color: 'var(--accent-orange)',
            }}>
            🔒 {formatLtc(profile.subscriptionPrice)} / month
          </div>
        )}
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {hasNextPage && (
        <div className="p-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            className="px-6 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Load more
          </button>
        </div>
      )}

      {posts.length === 0 && !isLoading && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="text-3xl mb-3">📝</div>
          <p>No posts yet</p>
        </div>
      )}

      {showSubscribe && <SubscribeModal creator={profile} onClose={() => setShowSubscribe(false)} />}
    </>
  )
}
