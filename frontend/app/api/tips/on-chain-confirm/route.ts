export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { z } from 'zod'

const Schema = z.object({
  postId: z.string().min(1),
  creatorUsername: z.string().min(1),
  txHash: z.string().min(1),
  amount: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const { postId, creatorUsername, txHash, amount } = Schema.parse(await req.json())

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return err('Post not found', 404)

    const creator = await prisma.user.findUnique({ where: { username: creatorUsername } })
    if (!creator) return err('Creator not found', 404)

    // Idempotency check
    const existing = await prisma.tip.findUnique({ where: { txHash } })
    if (existing) return ok({ confirmed: true, already: true })

    const amountDecimal = parseFloat(amount)

    await prisma.$transaction([
      prisma.tip.create({
        data: {
          postId,
          tipperId: me.id,
          recipientId: creator.id,
          amount: amountDecimal,
          txHash,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { tipsTotal: { increment: amountDecimal } },
      }),
      prisma.user.update({
        where: { id: creator.id },
        data: { totalEarned: { increment: amountDecimal } },
      }),
      prisma.notification.create({
        data: {
          userId: creator.id,
          type: 'NEW_TIP',
          fromUser: me.username,
          refId: postId,
          message: `${me.displayName || me.username} tipped ${amount} LTC on-chain!`,
        },
      }),
    ])

    return ok({ confirmed: true })
  } catch (error) { return handleError(error) }
}
