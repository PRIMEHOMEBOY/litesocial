export const dynamic = 'force-dynamic'
// app/api/notifications/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const me = await requireAuth()
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true'
    const cursor = req.nextUrl.searchParams.get('cursor')
    const limit = 20

    const notifications = await prisma.notification.findMany({
      where: {
        userId: me.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
    })

    const hasMore = notifications.length > limit
    return ok({
      notifications: notifications.slice(0, limit),
      nextCursor: hasMore ? notifications[limit - 1]?.id : null,
    })
  } catch (error) {
    return handleError(error)
  }
}
