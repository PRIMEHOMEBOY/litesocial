'use client'
// app/(app)/notifications/page.tsx
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { PageHeader } from '@/components/layout/PageHeader'
import { timeAgo } from '@/lib/utils'

const ICON_MAP: Record<string, string> = {
  NEW_SUBSCRIBER: '🎉',
  NEW_TIP: '💸',
  NEW_LIKE: '❤️',
  NEW_COMMENT: '💬',
  NEW_FOLLOWER: '👤',
  SUBSCRIPTION_EXPIRING: '⏰',
  PAYMENT_RECEIVED: '✅',
}

const COLOR_MAP: Record<string, string> = {
  NEW_SUBSCRIBER: 'rgba(126,232,162,0.15)',
  NEW_TIP: 'rgba(247,147,26,0.15)',
  NEW_LIKE: 'rgba(255,107,157,0.15)',
  NEW_COMMENT: 'rgba(155,99,255,0.15)',
  NEW_FOLLOWER: 'rgba(155,99,255,0.15)',
  PAYMENT_RECEIVED: 'rgba(126,232,162,0.15)',
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => api.getNotifications(false, pageParam as string | undefined) as Promise<{ notifications: any[]; nextCursor: string | null }>,
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

  return (
    <>
      <PageHeader title="Notifications">
        {unread.length > 0 && (
          <button
            onClick={() => markReadMutation.mutate(undefined)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}>
            Mark all read
          </button>
        )}
      </PageHeader>

      {isLoading && (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => !n.isRead && markReadMutation.mutate([n.id])}
          className="flex gap-3 px-5 py-4 cursor-pointer transition-colors"
          style={{
            borderBottom: '1px solid var(--border)',
            background: n.isRead ? 'transparent' : 'rgba(155,99,255,0.04)',
            borderLeft: n.isRead ? 'none' : '2px solid var(--accent-purple)',
          }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ background: COLOR_MAP[n.type] || 'var(--bg-elevated)' }}>
            {ICON_MAP[n.type] || '🔔'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug"
              dangerouslySetInnerHTML={{
                __html: n.message
                  .replace(/([\d.]+\s*LTC)/g, '<span style="font-family:var(--font-display);color:var(--accent-orange)">$1</span>')
                  .replace(/(@\w+)/g, '<span style="color:var(--accent-purple)">$1</span>'),
              }}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{timeAgo(n.createdAt)}</p>
          </div>
          {!n.isRead && (
            <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: 'var(--accent-purple)' }} />
          )}
        </div>
      ))}

      {hasNextPage && (
        <div className="p-4 flex justify-center">
          <button onClick={() => fetchNextPage()}
            className="px-6 py-2 rounded-xl text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Load more
          </button>
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
          <div className="text-4xl mb-4">🔔</div>
          <p>No notifications yet</p>
        </div>
      )}
    </>
  )
}
