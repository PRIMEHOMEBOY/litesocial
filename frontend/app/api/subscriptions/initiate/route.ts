export const dynamic = 'force-dynamic'
// app/api/subscriptions/initiate/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { InitiateSubscriptionSchema } from '@/lib/schemas'
import { watchAddress, generateDepositAddress } from '@/lib/blockcypher'

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const body = await req.json()
    const { creatorUsername } = InitiateSubscriptionSchema.parse(body)

    const creator = await prisma.user.findUnique({ where: { username: creatorUsername } })
    if (!creator) return err('Creator not found', 404)
    if (creator.id === me.id) return err('Cannot subscribe to yourself', 400)
    if (!creator.subscriptionPrice) return err('Creator has not set up subscriptions', 400)
    if (!creator.payoutAddress) return err('Creator has not set a payout address', 400)

    // Check if already actively subscribed
    const existing = await prisma.subscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId: me.id, creatorId: creator.id } },
    })
    if (existing?.status === 'ACTIVE' && existing.expiresAt && existing.expiresAt > new Date()) {
      return err('Already subscribed', 409)
    }

    // Count existing deposit addresses to derive next index
    const addrCount = await prisma.depositAddress.count()
    const { address } = generateDepositAddress(addrCount)

    // Register BlockCypher webhook to watch the address
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions/webhook`
    try {
      await watchAddress(address, webhookUrl)
    } catch (e) {
      console.error('BlockCypher webhook registration failed:', e)
      // Continue anyway — manual reconciliation possible
    }

    // Create or update subscription record
    const sub = await prisma.subscription.upsert({
      where: { subscriberId_creatorId: { subscriberId: me.id, creatorId: creator.id } },
      create: {
        subscriberId: me.id,
        creatorId: creator.id,
        status: 'PENDING',
        tier: creator.creatorTier,
        priceAtTime: creator.subscriptionPrice,
        depositAddress: address,
      },
      update: {
        status: 'PENDING',
        priceAtTime: creator.subscriptionPrice,
        depositAddress: address,
        txHash: null,
        confirmedAt: null,
        expiresAt: null,
      },
    })

    await prisma.depositAddress.create({
      data: {
        address,
        purpose: 'subscription',
        refId: sub.id,
        userId: me.id,
      },
    })

    return ok({
      depositAddress: address,
      amount: creator.subscriptionPrice.toString(),
      creatorUsername,
      expiresIn: '48 hours',
      subscriptionId: sub.id,
      ltcUri: `litecoin:${address}?amount=${creator.subscriptionPrice}&label=LiteSocial+Subscription`,
    })
  } catch (error) {
    return handleError(error)
  }
}
