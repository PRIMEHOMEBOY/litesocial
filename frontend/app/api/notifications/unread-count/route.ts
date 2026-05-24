export const dynamic = 'force-dynamic'
// app/api/notifications/unread-count/route.ts
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ok } from '@/lib/api-helpers'

export async function GET() {
  const me = await getCurrentUser()
  if (!me) return ok({ count: 0 })

  const count = await prisma.notification.count({
    where: { userId: me.id, isRead: false },
  })

  return ok({ count })
}
