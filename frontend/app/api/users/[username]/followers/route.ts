// app/api/users/[username]/followers/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const user = await prisma.user.findUnique({ where: { username: (await context.params).username } })
    if (!user) return notFound('User')

    const follows = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true, username: true, displayName: true,
            avatarIpfsHash: true, isVerified: true, creatorTier: true,
            _count: { select: { followedBy: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return ok({ users: follows.map(f => f.follower) })
  } catch (e) { return handleError(e) }
}
