import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, handleError } from '@/lib/api-helpers'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const user = await prisma.user.findUnique({ where: { username: params.username } })
    if (!user) return notFound('User')
    const follows = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true, creatorTier: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return ok({ users: follows.map(f => f.follower) })
  } catch (e) { return handleError(e) }
}
