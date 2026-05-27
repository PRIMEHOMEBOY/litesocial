'use client'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/useAuthStore'
import { PostCard } from '@/components/feed/PostCard'
import { SubscribeModal } from '@/components/subscription/SubscribeModal'
import { Avatar } from '@/components/ui/Avatar'
import { useState } from 'react'
import { formatLtc, truncateAddress, getIpfsUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

const TIER_LABELS: Record<string,string> = { BASIC:'Basic', PRO:'Pro', ELITE:'Elite', NONE:'' }
const TIER_COLORS: Record<string,string> = { BASIC:'#7a90b0', PRO:'var(--accent-blue-lt)', ELITE:'var(--accent-orange)', NONE:'' }

type PostPage = { posts: any[]; nextCursor: string | null }

function FollowListModal({ username, type, onClose }: { username: string; type: 'followers'|'following'; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['follow-list', username, type],
    queryFn: () => fetch(`/api/users/${username}/${type}`, { credentials: 'include' }).then(r => r.json()) as Promise<{ users: any[] }>,
  })
  const users = data?.users ?? []

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>{type === 'followers' ? 'Followers' : 'Following'}</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {isLoading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>}
          {users.map(u => (
            <Link key={u.id} href={`/${u.username}`} onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', textDecoration: 'none', transition: 'background 140ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,93,157,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Avatar name={u.displayName || u.username} src={getIpfsUrl(u.avatarIpfsHash)} size={42} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {u.displayName || u.username}
                  {u.isVerified && <img src="/ltc-logo.svg" alt="✓" style={{ width: 14, height: 14 }} />}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>@{u.username}</div>
              </div>
            </Link>
          ))}
          {!isLoading && users.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const me = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [showSubscribe, setShowSubscribe] = useState(false)
  const [followModal, setFollowModal] = useState<'followers'|'following'|null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => api.getUser(username) as Promise<any>,
  })

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery<PostPage, Error, { pages: PostPage[] }, string[], string | undefined>({
    queryKey: ['user-posts', username],
    queryFn: ({ pageParam }) => api.getUserPosts(username, pageParam) as Promise<PostPage>,
    initialPageParam: undefined,
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
      <div style={{ animationName: 'pulse', animationDuration: '2s', animationIterationCount: 'infinite' }}>
        <div style={{ height: 144, background: 'var(--bg-elevated)' }} />
        <div style={{ padding: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--border)', marginBottom: 12 }} />
          <div style={{ height: 20, width: 160, borderRadius: 6, background: 'var(--border)', marginBottom: 8 }} />
          <div style={{ height: 14, width: 260, borderRadius: 6, background: 'var(--border)' }} />
        </div>
      </div>
    )
  }

  if (!profile) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>User not found</div>

  const avatarUrl = getIpfsUrl(profile.avatarIpfsHash)
  const bannerUrl = getIpfsUrl(profile.bannerIpfsHash)
  const tierColor = TIER_COLORS[profile.creatorTier] || ''
  const tierLabel = TIER_LABELS[profile.creatorTier] || ''
  const showEarnings = profile.showEarnings !== false

  return (
    <>
      {/* Banner */}
      <div style={{ height: 144, position: 'relative', overflow: 'hidden', background: bannerUrl ? undefined : 'linear-gradient(135deg,#0d1a2e,#0a1830,#091525)' }}>
        {bannerUrl && <Image src={bannerUrl} alt="Banner" fill style={{ objectFit: 'cover' }} />}
      </div>

      {/* Profile info */}
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
        {/* Avatar + actions row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 12 }}>
          {/* Avatar — fixed size, no crop */}
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--bg-base)', overflow: 'hidden', flexShrink: 0, background: avatarUrl ? undefined : 'linear-gradient(135deg,#345D9D,#4a80d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff' }}>
            {avatarUrl
              ? <Image src={avatarUrl} alt={profile.displayName} width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              : (profile.displayName?.[0] || profile.username[0]).toUpperCase()
            }
          </div>

          {/* Action buttons */}
          {!isOwnProfile && (
            <div style={{ display: 'flex', gap: 8, paddingTop: 40 }}>
              <button onClick={() => followMutation.mutate()}
                style={{ padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: profile.isFollowing ? 'transparent' : 'var(--accent-blue)', border: `1px solid ${profile.isFollowing ? 'var(--border)' : 'var(--accent-blue)'}`, color: profile.isFollowing ? 'var(--text-secondary)' : '#fff', transition: 'all 160ms' }}>
                {profile.isFollowing ? 'Following ✓' : 'Follow'}
              </button>
              {profile.subscriptionPrice && (
                <button onClick={() => setShowSubscribe(true)}
                  style={{ padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--accent-orange)', border: 'none', color: '#fff' }}>
                  Subscribe
                </button>
              )}
            </div>
          )}
        </div>

        {/* Name */}
        <h1 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {profile.displayName || profile.username}
          {profile.isVerified && <img src="/ltc-logo.svg" alt="verified" style={{ width: 20, height: 20 }} />}
          {tierLabel && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}40` }}>{tierLabel}</span>
          )}
        </h1>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', marginTop: 2 }}>
          @{profile.username}
          {profile.ltcAddress && <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>· {truncateAddress(profile.ltcAddress)}</span>}
        </p>

        {profile.bio && <p style={{ fontSize: 14, marginTop: 10, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{profile.bio}</p>}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{profile._count?.posts ?? 0}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>Posts</span>
          </div>
          {/* Clickable followers */}
          <div onClick={() => setFollowModal('followers')} style={{ cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{(profile._count?.followedBy ?? 0).toLocaleString()}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>Followers</span>
          </div>
          {/* Clickable following */}
          <div onClick={() => setFollowModal('following')} style={{ cursor: 'pointer' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{profile._count?.following ?? 0}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>Following</span>
          </div>
          {/* Earnings — only show if allowed */}
          {showEarnings && (
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display)', color: 'var(--accent-green)' }}>{parseFloat(profile.totalEarned || 0).toFixed(2)}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>LTC earned</span>
            </div>
          )}
        </div>

        {profile.subscriptionPrice && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '5px 14px', borderRadius: 20, background: 'rgba(247,147,26,0.1)', border: '1px solid rgba(247,147,26,0.25)', color: 'var(--accent-orange)', fontSize: 13 }}>
            🔒 {formatLtc(profile.subscriptionPrice)} / month
          </div>
        )}
      </div>

      {/* Posts */}
      {posts.map((post) => <PostCard key={post.id} post={post} />)}

      {hasNextPage && (
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => fetchNextPage()} style={{ padding: '8px 24px', borderRadius: 10, fontSize: 13, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Load more
          </button>
        </div>
      )}

      {posts.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
          <p style={{ fontSize: 14 }}>No posts yet</p>
        </div>
      )}

      {showSubscribe && <SubscribeModal creator={profile} onClose={() => setShowSubscribe(false)} />}
      {followModal && <FollowListModal username={username} type={followModal} onClose={() => setFollowModal(null)} />}
    </>
  )
}
