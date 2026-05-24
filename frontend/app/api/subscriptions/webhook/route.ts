export const dynamic = 'force-dynamic'
// app/api/subscriptions/webhook/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err } from '@/lib/api-helpers'
import { satoshisToLtc } from '@/lib/blockcypher'
import { sendPaymentConfirmationEmail } from '@/lib/email'
import Decimal from 'decimal.js'

export async function POST(req: NextRequest) {
  try {
    // Verify BlockCypher token
    const token = req.nextUrl.searchParams.get('token')
    if (token !== process.env.BLOCKCYPHER_TOKEN) {
      return err('Unauthorized', 401)
    }

    const payload = await req.json()
    const { addresses, total, confirmations, hash } = payload

    if (!addresses?.length || !hash) return ok({ received: true })
    if (confirmations < 3) return ok({ received: true, waiting: true })

    const depositAddress = addresses[0]

    const depositRecord = await prisma.depositAddress.findUnique({
      where: { address: depositAddress },
    })
    if (!depositRecord || depositRecord.isUsed) return ok({ received: true })

    const subscription = await prisma.subscription.findUnique({
      where: { id: depositRecord.refId },
      include: {
        creator: { select: { id: true, username: true, email: true, totalEarned: true } },
        subscriber: { select: { id: true, username: true, displayName: true } },
      },
    })

    if (!subscription || subscription.status !== 'PENDING') return ok({ received: true })

    const receivedLtc = satoshisToLtc(total)
    const expectedLtc = new Decimal(subscription.priceAtTime.toString())
    const tolerance = expectedLtc.mul(0.01)

    if (receivedLtc.lt(expectedLtc.minus(tolerance))) {
      // Underpayment — notify subscriber
      await prisma.notification.create({
        data: {
          userId: subscription.subscriberId,
          type: 'PAYMENT_RECEIVED',
          refId: subscription.id,
          message: `Underpayment detected. Expected ${expectedLtc} LTC, received ${receivedLtc} LTC. Please top up within 48 hours.`,
        },
      })
      return ok({ received: true, underpayment: true })
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          confirmedAt: new Date(),
          expiresAt,
          txHash: hash,
          renewalCount: { increment: 1 },
        },
      }),
      prisma.depositAddress.update({
        where: { id: depositRecord.id },
        data: { isUsed: true },
      }),
      prisma.user.update({
        where: { id: subscription.creatorId },
        data: { totalEarned: { increment: receivedLtc.toNumber() } },
      }),
      prisma.notification.create({
        data: {
          userId: subscription.creatorId,
          type: 'NEW_SUBSCRIBER',
          fromUser: subscription.subscriber.username,
          refId: subscription.id,
          message: `${subscription.subscriber.displayName || subscription.subscriber.username} subscribed! You received ${receivedLtc} LTC`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: subscription.subscriberId,
          type: 'PAYMENT_RECEIVED',
          refId: subscription.id,
          message: `Your subscription to ${subscription.creator.username} is now active. Expires ${expiresAt.toLocaleDateString()}.`,
        },
      }),
    ])

    // Send email confirmation to creator (non-blocking)
    if (subscription.creator.email) {
      sendPaymentConfirmationEmail(
        subscription.creator.email,
        receivedLtc.toString(),
        hash
      ).catch(console.error)
    }

    return ok({ received: true, activated: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return ok({ received: true }) // Always 200 to BlockCypher
  }
}
