// app/api/creator-tier/initiate/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { watchAddress, generateDepositAddress } from '@/lib/blockcypher'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const Schema = z.object({ tier: z.enum(['BASIC', 'PRO', 'ELITE']) })
const TIER_PRICES: Record<string, string> = { BASIC: '0.2', PRO: '0.5', ELITE: '1.0' }

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const { tier } = Schema.parse(await req.json())
    if (me.creatorTier !== 'NONE') return err('Already a creator', 400)

    const price = TIER_PRICES[tier]
    const addrCount = await prisma.depositAddress.count()
    const { address } = generateDepositAddress(addrCount + 500000)

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/creator-tier/webhook`
    try { await watchAddress(address, webhookUrl) } catch {}

    await prisma.depositAddress.create({
      data: { address, purpose: 'creator_tier', refId: `${me.id}:${tier}`, userId: me.id },
    })

    return ok({ depositAddress: address, amount: price, tier, ltcUri: `litecoin:${address}?amount=${price}&label=PrimeDesk+Creator+${tier}` })
  } catch (error) { return handleError(error) }
}
