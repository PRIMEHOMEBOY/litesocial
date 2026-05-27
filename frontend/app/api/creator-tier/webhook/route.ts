// app/api/creator-tier/webhook/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err } from '@/lib/api-helpers'
import { satoshisToLtc } from '@/lib/blockcypher'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (token !== process.env.BLOCKCYPHER_TOKEN) return err('Unauthorized', 401)

    const { addresses, total, confirmations, hash } = await req.json()
    if (!addresses?.length || confirmations < 3) return ok({ received: true })

    const depositRecord = await prisma.depositAddress.findUnique({
      where: { address: addresses[0] },
    })
    if (!depositRecord || depositRecord.isUsed || depositRecord.purpose !== 'creator_tier') return ok({ received: true })

    const [userId, tier] = depositRecord.refId.split(':')
    const tierPrices: Record<string, number> = { BASIC: 0.2, PRO: 0.5, ELITE: 1.0 }
    const expected = tierPrices[tier]
    const received = satoshisToLtc(total).toNumber()

    if (received < expected * 0.99) return ok({ received: true, underpayment: true })

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { creatorTier: tier as any, isVerified: true },
      }),
      prisma.depositAddress.update({
        where: { id: depositRecord.id },
        data: { isUsed: true },
      }),
      prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_RECEIVED',
          message: `🎉 Your ${tier} creator subscription is now active! Your Litecoin checkmark has been added.`,
        },
      }),
    ])

    return ok({ received: true, activated: true })
  } catch (e) {
    console.error('Creator tier webhook error:', e)
    return ok({ received: true })
  }
}
