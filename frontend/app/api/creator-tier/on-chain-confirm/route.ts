export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { z } from 'zod'

const Schema = z.object({
  tier: z.enum(['BASIC', 'PRO', 'ELITE']),
  txHash: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const { tier, txHash } = Schema.parse(await req.json())

    await prisma.user.update({
      where: { id: me.id },
      data: { creatorTier: tier, isVerified: true },
    })

    await prisma.notification.create({
      data: {
        userId: me.id,
        type: 'PAYMENT_RECEIVED',
        message: `🎉 Your ${tier} creator tier is now active on-chain! TX: ${txHash.slice(0, 10)}…`,
      },
    })

    return ok({ confirmed: true, tier })
  } catch (error) { return handleError(error) }
}
