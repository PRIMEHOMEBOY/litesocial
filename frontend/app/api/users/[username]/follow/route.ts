export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const me = await requireAuth()
    const target = await prisma.user.findUnique({ where: { username } })
    if (!target) return err('User not found', 404)
    if (target.id === me.id) return err('Cannot follow yourself', 400)

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    })

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
      return ok({ following: false })
    }

    await prisma.follow.create({ data: { followerId: me.id, followingId: target.id } })
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: 'NEW_FOLLOWER',
        fromUser: me.username,
        message: `${me.displayName || me.username} started following you`,
      },
    })

    return ok({ following: true })
  } catch (error) { return handleError(error) }
}
