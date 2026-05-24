// app/api/users/me/earnings/route.ts
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const me = await requireAuth()

    const [
      totalSubs,
      activeSubs,
      tipsReceived,
      recentTips,
      monthlyData,
    ] = await Promise.all([
      // All-time subscriber count
      prisma.subscription.count({ where: { creatorId: me.id } }),
      // Active subscriber count
      prisma.subscription.count({ where: { creatorId: me.id, status: 'ACTIVE' } }),
      // Sum of all tips received
      prisma.tip.aggregate({ where: { recipientId: me.id }, _sum: { amount: true } }),
      // Recent tips with post context
      prisma.tip.findMany({
        where: { recipientId: me.id },
        orderBy: { confirmedAt: 'desc' },
        take: 10,
        include: {
          post: { select: { id: true, content: true } },
          tipper: { select: { username: true, displayName: true } },
        },
      }),
      // Monthly revenue for last 6 months
      prisma.$queryRaw<{ month: string; ltc: number }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', confirmed_at), 'Mon') as month,
          COALESCE(SUM(price_at_time), 0)::float as ltc
        FROM subscriptions
        WHERE creator_id = ${me.id}
          AND status = 'ACTIVE'
          AND confirmed_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', confirmed_at)
        ORDER BY DATE_TRUNC('month', confirmed_at)
      `,
    ])

    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: { totalEarned: true },
    })

    return ok({
      totalEarned: user?.totalEarned?.toString() || '0',
      totalSubscribers: totalSubs,
      activeSubscribers: activeSubs,
      tipsTotal: tipsReceived._sum.amount?.toString() || '0',
      recentTips,
      monthlyRevenue: monthlyData,
    })
  } catch (error) {
    return handleError(error)
  }
}
