export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError } from '@/lib/api-helpers'
import { CommentSchema } from '@/lib/schemas'

export async function GET(req: NextRequest, context: any) {
  try {
    const postId = context.params.postId as string
    const cursor = req.nextUrl.searchParams.get('cursor')
    const limit = 20

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true },
        },
      },
    })

    const hasMore = comments.length > limit
    return ok({ comments: comments.slice(0, limit), nextCursor: hasMore ? comments[limit - 1]?.id : null })
  } catch (error) { return handleError(error) }
}

export async function POST(req: NextRequest, context: any) {
  try {
    const postId = context.params.postId as string
    const me = await requireAuth()
    const body = await req.json()
    const { content } = CommentSchema.parse(body)

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { postId, authorId: me.id, content },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true } },
        },
      }),
      prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } }),
    ])

    prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
      .then((post) => {
        if (post && post.authorId !== me.id) {
          return prisma.notification.create({
            data: {
              userId: post.authorId, type: 'NEW_COMMENT',
              fromUser: me.username, refId: postId,
              message: `${me.displayName || me.username} commented on your post`,
            },
          })
        }
      }).catch(console.error)

    return ok(comment, 201)
  } catch (error) { return handleError(error) }
}
