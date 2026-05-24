export const dynamic = 'force-dynamic'
// app/api/posts/[postId]/like/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const me = await requireAuth()
    const { postId } = params

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId: me.id } },
    })

    if (existing) {
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } }),
      ])
      return ok({ liked: false })
    }

    await prisma.$transaction([
      prisma.like.create({ data: { postId, userId: me.id } }),
      prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } }),
    ])

    // Notify post author (async, non-blocking)
    prisma.post
      .findUnique({ where: { id: postId }, select: { authorId: true } })
      .then((post) => {
        if (post && post.authorId !== me.id) {
          return prisma.notification.create({
            data: {
              userId: post.authorId,
              type: 'NEW_LIKE',
              fromUser: me.username,
              refId: postId,
              message: `${me.displayName || me.username} liked your post`,
            },
          })
        }
      })
      .catch(console.error)

    return ok({ liked: true })
  } catch (error) {
    return handleError(error)
  }
}
