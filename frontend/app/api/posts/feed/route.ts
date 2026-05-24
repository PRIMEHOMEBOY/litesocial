// app/api/posts/feed/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const me = await requireAuth()
    const cursor = req.nextUrl.searchParams.get('cursor')
    const tab = req.nextUrl.searchParams.get('tab') || 'for-you'
    const limit = 20

    // Get followed users
    const follows = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true },
    })
    const followingIds = follows.map((f) => f.followingId)

    const whereClause =
      tab === 'following'
        ? { authorId: { in: followingIds }, isDeleted: false }
        : {
            isDeleted: false,
            OR: [
              { authorId: { in: followingIds } },
              { likesCount: { gt: 10 } },
              { tipsTotal: { gt: 0 } },
            ],
          }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true, creatorTier: true, subscriptionPrice: true },
        },
        likes: { where: { userId: me.id }, select: { id: true } },
      },
    })

    // Get active subscriptions to determine which premium posts are unlocked
    const creatorIds = [...new Set(posts.map((p) => p.authorId))]
    const subs = await prisma.subscription.findMany({
      where: { subscriberId: me.id, creatorId: { in: creatorIds }, status: 'ACTIVE' },
      select: { creatorId: true },
    })
    const subscribedTo = new Set(subs.map((s) => s.creatorId))

    const hasMore = posts.length > limit
    const items = posts.slice(0, limit).map((post) => {
      const isOwn = post.authorId === me.id
      const isSubscribed = subscribedTo.has(post.authorId)
      const isLocked = post.isPremium && !isSubscribed && !isOwn
      return {
        ...post,
        isLiked: post.likes.length > 0,
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
