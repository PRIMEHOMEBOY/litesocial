// app/api/explore/creators/route.ts
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const me = await getCurrentUser()

    const creators = await prisma.user.findMany({
      where: {
        creatorTier: { not: 'NONE' },
        subscriptionPrice: { not: null },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarIpfsHash: true,
        isVerified: true,
        creatorTier: true,
        subscriptionPrice: true,
        totalEarned: true,
        _count: {
          select: {
            subscriptionsReceived: { where: { status: 'ACTIVE' } },
            followedBy: true,
          },
        },
      },
      orderBy: { totalEarned: 'desc' },
      take: 20,
    })

    // Attach isFollowing for logged-in users
    let followingSet = new Set<string>()
    if (me) {
      const follows = await prisma.follow.findMany({
        where: { followerId: me.id, followingId: { in: creators.map((c) => c.id) } },
        select: { followingId: true },
      })
      followingSet = new Set(follows.map((f) => f.followingId))
    }

    return ok({
      creators: creators.map((c) => ({
        ...c,
        isFollowing: followingSet.has(c.id),
        subscriberCount: c._count.subscriptionsReceived,
        followerCount: c._count.followedBy,
      })),
    })
  } catch (error) {
    return handleError(error)
  }
}
