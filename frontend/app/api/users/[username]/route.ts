export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ok, notFound, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, context: any) {
  try {
    const username = context.params.username as string
    const me = await getCurrentUser()
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, displayName: true, bio: true,
        avatarIpfsHash: true, bannerIpfsHash: true, ltcAddress: true,
        isVerified: true, creatorTier: true, subscriptionPrice: true,
        totalEarned: true, showEarnings: true, createdAt: true,
        _count: {
          select: {
            posts: { where: { isDeleted: false } },
            followedBy: true,
            following: true,
          },
        },
      },
    })

    if (!user) return notFound('User')

    let isFollowing = false
    let isSubscribed = false
    if (me) {
      const [follow, sub] = await Promise.all([
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: me.id, followingId: user.id } }
        }),
        prisma.subscription.findUnique({
          where: { subscriberId_creatorId: { subscriberId: me.id, creatorId: user.id } }
        }),
      ])
      isFollowing = !!follow
      isSubscribed = sub?.status === 'ACTIVE'
    }

    return ok({ ...user, isFollowing, isSubscribed })
  } catch (error) { return handleError(error) }
}
