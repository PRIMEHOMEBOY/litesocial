// app/api/users/me/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api-helpers'
import { UpdateUserSchema } from '@/lib/schemas'

export async function PATCH(req: NextRequest) {
  try {
    const me = await requireAuth()
    const body = await req.json()
    const data = UpdateUserSchema.parse(body)

    // If changing username, check availability
    if (data.username && data.username !== me.username) {
      const taken = await prisma.user.findUnique({ where: { username: data.username } })
      if (taken) return err('Username already taken', 409)
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        ...data,
        subscriptionPrice: data.subscriptionPrice !== undefined
          ? data.subscriptionPrice
          : undefined,
      },
      select: {
        id: true, email: true, emailVerified: true, username: true,
        displayName: true, bio: true, avatarIpfsHash: true, bannerIpfsHash: true,
        ltcAddress: true, isVerified: true, creatorTier: true,
        subscriptionPrice: true, payoutAddress: true,
        showEarnings: true, totalEarned: true,
      },
    })

    return ok(updated)
  } catch (error) {
    return handleError(error)
  }
}
