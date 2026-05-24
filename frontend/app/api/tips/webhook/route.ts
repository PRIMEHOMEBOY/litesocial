// app/api/tips/webhook/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err } from '@/lib/api-helpers'
import { satoshisToLtc } from '@/lib/blockcypher'

export async function POST(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (token !== process.env.BLOCKCYPHER_TOKEN) return err('Unauthorized', 401)

    const payload = await req.json()
    const { addresses, total, confirmations, hash } = payload

    if (!addresses?.length || !hash) return ok({ received: true })
    if (confirmations < 3) return ok({ received: true, waiting: true })

    const depositRecord = await prisma.depositAddress.findUnique({
      where: { address: addresses[0] },
    })
    if (!depositRecord || depositRecord.isUsed || depositRecord.purpose !== 'tip') {
      return ok({ received: true })
    }

    const post = await prisma.post.findUnique({
      where: { id: depositRecord.refId },
      select: { id: true, authorId: true },
    })
    if (!post) return ok({ received: true })

    const amountLtc = satoshisToLtc(total)

    // Check txHash is unique (idempotency)
    const existingTip = await prisma.tip.findUnique({ where: { txHash: hash } })
    if (existingTip) return ok({ received: true })

    const tipper = await prisma.user.findUnique({ where: { id: depositRecord.userId } })
    if (!tipper) return ok({ received: true })

    await prisma.$transaction([
      prisma.tip.create({
        data: {
          postId: post.id,
          tipperId: tipper.id,
          recipientId: post.authorId,
          amount: amountLtc.toNumber(),
          txHash: hash,
        },
      }),
      prisma.post.update({
        where: { id: post.id },
        data: { tipsTotal: { increment: amountLtc.toNumber() } },
      }),
      prisma.user.update({
        where: { id: post.authorId },
        data: { totalEarned: { increment: amountLtc.toNumber() } },
      }),
      prisma.depositAddress.update({
        where: { id: depositRecord.id },
        data: { isUsed: true },
      }),
      prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'NEW_TIP',
          fromUser: tipper.username,
          refId: post.id,
          message: `${tipper.displayName || tipper.username} tipped ${amountLtc} LTC on your post`,
        },
      }),
    ])

    return ok({ received: true, recorded: true })
  } catch (error) {
    console.error('Tip webhook error:', error)
    return ok({ received: true })
  }
}
