export const dynamic = 'force-dynamic'
// app/api/posts/explore/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const me = await getCurrentUser()
    const timeframe = req.nextUrl.searchParams.get('timeframe') || '24h'
    const cursor = req.nextUrl.searchParams.get('cursor')
    const tag = req.nextUrl.searchParams.get('tag')
    const limit = 20

    const hoursMap: Record<string, number> = { '24h': 24, '7d': 168, '30d': 720 }
    const hours = hoursMap[timeframe] || 24
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: since },
        ...(tag ? { tags: { has: tag } } : {}),
      },
      orderBy: [{ likesCount: 'desc' }, { tipsTotal: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true, creatorTier: true, subscriptionPrice: true },
        },
        likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
      },
    })

    let subscribedTo = new Set<string>()
    if (me) {
      const creatorIds = [...new Set(posts.map((p) => p.authorId))]
      const subs = await prisma.subscription.findMany({
        where: { subscriberId: me.id, creatorId: { in: creatorIds }, status: 'ACTIVE' },
        select: { creatorId: true },
      })
      subscribedTo = new Set(subs.map((s) => s.creatorId))
    }

    const hasMore = posts.length > limit
    const items = posts.slice(0, limit).map((post) => {
      const isOwn = me?.id === post.authorId
      const isSubscribed = subscribedTo.has(post.authorId)
      const isLocked = post.isPremium && !isSubscribed && !isOwn
      return {
        ...post,
        isLiked: Array.isArray(post.likes) ? post.likes.length > 0 : false,
        likes: undefined,
        isLocked,
        content: isLocked ? post.contentPreview : post.content,
      }
    })

    return ok({ posts: items, nextCursor: hasMore ? items[items.length - 1]?.id : null })
  } catch (error) {
    return handleError(error)
  }
}
