'use client'
// components/creator/CreatorCard.tsx
import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Avatar } from '@/components/ui/Avatar'
import { formatLtc } from '@/lib/utils'

export function CreatorCard({ creator, compact = false }: { creator: any; compact?: boolean }) {
  const qc = useQueryClient()
  const [following, setFollowing] = useState(creator.isFollowing)

  const followMutation = useMutation({
    mutationFn: () => api.toggleFollow(creator.username),
    onMutate: () => setFollowing((f: boolean) => !f),
    onError: () => setFollowing((f: boolean) => !f),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['top-creators'] }),
  })

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-elevated cursor-pointer">
      <Link href={`/${creator.username}`}>
        <Avatar name={creator.displayName || creator.username} size={compact ? 34 : 42} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/${creator.username}`}>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold truncate">{creator.displayName || creator.username}</span>
            {creator.isVerified && <span style={{ color: 'var(--accent-blue)', fontSize: 12 }}>✓</span>}
          </div>
          {!compact && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
              {(creator.followerCount || 0).toLocaleString()} followers · {parseFloat(creator.totalEarned || 0).toFixed(2)} LTC earned
            </div>
          )}
          {compact && (
            <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
              {(creator.followerCount || 0).toLocaleString()} followers
            </div>
          )}
        </Link>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); followMutation.mutate() }}
        className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
        style={{
          border: `1px solid ${following ? 'var(--border)' : 'var(--accent-blue)'}`,
          color: following ? 'var(--text-secondary)' : 'var(--accent-blue)',
          background: 'transparent',
        }}>
        {following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}
