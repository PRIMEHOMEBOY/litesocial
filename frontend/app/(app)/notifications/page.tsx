'use client'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { PageHeader } from '@/components/layout/PageHeader'
import { timeAgo } from '@/lib/utils'

const ICON_MAP: Record<string, string> = {
  NEW_SUBSCRIBER: '🎉',
  NEW_TIP: '⚡',
  NEW_LIKE: '❤️',
  NEW_COMMENT: '💬',
  NEW_FOLLOWER: '👤',
  SUBSCRIPTION_EXPIRING: '⏰',
  PAYMENT_RECEIVED: '✅',
}

const COLOR_MAP: Record<string, string> = {
  NEW_SUBSCRIBER: 'rgba(74,222,128,0.12)',
  NEW_TIP:        'rgba(247,147,26,0.12)',
  NEW_LIKE:       'rgba(248,113,113,0.12)',
  NEW_COMMENT:    'rgba(52,93,157,0.15)',
  NEW_FOLLOWER:   'rgba(52,93,157,0.15)',
  PAYMENT_RECEIVED:'rgba(74,222,128,0.12)',
}

// Bug fix: map notification type + refId to the correct route
function getNotificationRoute(n: any): string | null {
  if ((n.type === 'NEW_LIKE' || n.type === 'NEW_COMMENT' || n.type === 'NEW_TIP') && n.refId) {
    return `/post/${n.refId}`
  }
  if (n.type === 'NEW_FOLLOWER' && n.fromUser) {
    return `/${n.fromUser}`
  }
  if (n.type === 'NEW_SUBSCRIBER' && n.fromUser) {
    return `/${n.fromUser}`
  }
  return null
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const router = useRouter()

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api.getNotifications(false, pageParam) as Promise<{ notifications: any[]; nextCursor: string | null }>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const markReadMutation = useMutation({
    mutationFn: (ids?: string[]) => api.markNotificationsRead(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? []
  const unread = notifications.filter((n) => !n.isRead)

  const handleTap = (n: any) => {
    // Mark as read
    if (!n.isRead) markReadMutation.mutate([n.id])
    // Navigate to the relevant content
    const route = getNotificationRoute(n)
    if (route) router.push(route)
  }

  return (
    <>
      <PageHeader title="Notifications">
        {unread.length > 0 && (
          <button onClick={() => markReadMutation.mutate(undefined)}
            style={{
              fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent',
            }}>
            Mark all read
          </button>
        )}
      </PageHeader>

      {isLoading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
      )}

      {notifications.map((n) => {
        const route = getNotificationRoute(n)
        return (
          <div key={n.id}
            onClick={() => handleTap(n)}
            style={{
              display: 'flex', gap: 12, padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              background: n.isRead ? 'transparent' : 'rgba(52,93,157,0.05)',
              borderLeft: n.isRead ? 'none' : '3px solid var(--accent-blue)',
              cursor: route ? 'pointer' : 'default',
              transition: 'background 140ms',
            }}
            onMouseEnter={e => { if (route) e.currentTarget.style.background = 'rgba(52,93,157,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(52,93,157,0.05)' }}>

            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
              background: COLOR_MAP[n.type] || 'var(--bg-elevated)',
            }}>
              {ICON_MAP[n.type] || '🔔'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{
                  __html: n.message
                    .replace(/([\d.]+\s*LTC)/g, '<span style="font-family:var(--font-display);color:var(--accent-orange)">$1</span>')
                    .replace(/(@\w+)/g, '<span style="color:var(--accent-blue-lt)">$1</span>'),
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</p>
                {route && <span style={{ fontSize: 11, color: 'var(--accent-blue-lt)' }}>Tap to view →</span>}
              </div>
            </div>

            {!n.isRead && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue-lt)', flexShrink: 0, marginTop: 6 }} />
            )}
          </div>
        )
      })}

      {hasNextPage && (
        <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => fetchNextPage()}
            style={{
              padding: '8px 24px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
            }}>
            Load more
          </button>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
          <p>No notifications yet</p>
        </div>
      )}
    </>
  )
}
