export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ creatorUsername: string }> }
) {
  try {
    const { creatorUsername } = await params
    const me = await requireAuth()
    const creator = await prisma.user.findUnique({ where: { username: creatorUsername } })
    if (!creator) return ok({ isSubscribed: false, status: null, expiresAt: null })

    const sub = await prisma.subscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId: me.id, creatorId: creator.id } },
    })

    const isSubscribed = sub?.status === 'ACTIVE' && (!sub.expiresAt || sub.expiresAt > new Date())

    return ok({
      isSubscribed,
      status: sub?.status || null,
      expiresAt: sub?.expiresAt || null,
      depositAddress: sub?.status === 'PENDING' ? sub.depositAddress : null,
      amount: sub?.priceAtTime?.toString() || null,
    })
  } catch (error) { return handleError(error) }
}
