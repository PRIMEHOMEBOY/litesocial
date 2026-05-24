// app/api/notifications/read/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function PATCH(req: NextRequest) {
  try {
    const me = await requireAuth()
    const body = await req.json().catch(() => ({}))
    const ids: string[] | undefined = body.ids

    await prisma.notification.updateMany({
      where: {
        userId: me.id,
        ...(ids?.length ? { id: { in: ids } } : {}),
      },
      data: { isRead: true },
    })

    return ok({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
