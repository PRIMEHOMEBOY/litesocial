export const dynamic = 'force-dynamic'
// app/api/tips/initiate/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { InitiateTipSchema } from '@/lib/schemas'
import { watchAddress, generateDepositAddress } from '@/lib/blockcypher'

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const body = await req.json()
    const { postId, amount } = InitiateTipSchema.parse(body)

    const post = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: { author: { select: { id: true, username: true, payoutAddress: true } } },
    })
    if (!post) return err('Post not found', 404)
    if (post.authorId === me.id) return err('Cannot tip your own post', 400)

    const addrCount = await prisma.depositAddress.count()
    const { address } = generateDepositAddress(addrCount + 100000) // offset from subscriptions

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tips/webhook`
    try {
      await watchAddress(address, webhookUrl)
    } catch (e) {
      console.error('BlockCypher tip webhook failed:', e)
    }

    await prisma.depositAddress.create({
      data: {
        address,
        purpose: 'tip',
        refId: postId,
        userId: me.id,
      },
    })

    return ok({
      depositAddress: address,
      amount,
      postId,
      ltcUri: `litecoin:${address}?amount=${amount}&label=LiteSocial+Tip`,
    })
  } catch (error) {
    return handleError(error)
  }
}
