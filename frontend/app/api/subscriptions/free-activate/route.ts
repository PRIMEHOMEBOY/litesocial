// app/api/subscriptions/free-activate/route.ts
export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { z } from 'zod'

const Schema = z.object({ creatorUsername: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const { creatorUsername } = Schema.parse(await req.json())

    const creator = await prisma.user.findUnique({ where: { username: creatorUsername } })
    if (!creator) return err('Creator not found', 404)
    if (creator.id === me.id) return err('Cannot subscribe to yourself', 400)

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await prisma.subscription.upsert({
      where: { subscriberId_creatorId: { subscriberId: me.id, creatorId: creator.id } },
      create: {
        subscriberId: me.id,
        creatorId: creator.id,
        status: 'ACTIVE',
        tier: creator.creatorTier || 'BASIC',
        priceAtTime: creator.subscriptionPrice || 0,
        depositAddress: 'recaptcha-verified',
        confirmedAt: new Date(),
        expiresAt,
      },
      update: {
        status: 'ACTIVE',
        confirmedAt: new Date(),
        expiresAt,
      },
    })

    await prisma.notification.create({
      data: {
        userId: creator.id,
        type: 'NEW_SUBSCRIBER',
        fromUser: me.username,
        message: `${me.displayName || me.username} subscribed to your channel!`,
      },
    })

    return ok({ subscribed: true, expiresAt })
  } catch (error) {
    return handleError(error)
  }
}
