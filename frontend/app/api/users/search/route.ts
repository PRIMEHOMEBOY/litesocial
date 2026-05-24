// app/api/users/search/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')
    if (!q || q.length < 1) return err('Query required')

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true, username: true, displayName: true,
        avatarIpfsHash: true, isVerified: true, creatorTier: true,
        _count: { select: { followedBy: true } },
      },
      take: 10,
    })

    return ok({ users })
  } catch (error) {
    return handleError(error)
  }
}
