// app/api/posts/[postId]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ok, notFound, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const me = await getCurrentUser()

    const post = await prisma.post.findUnique({
      where: { id: params.postId, isDeleted: false },
      include: {
        author: {
          select: {
            id: true, username: true, displayName: true,
            avatarIpfsHash: true, isVerified: true,
            creatorTier: true, subscriptionPrice: true,
          },
        },
        likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
        _count: { select: { likes: true, comments: true } },
      },
    })

    if (!post) return notFound('Post')

    let isSubscribed = false
    if (me && post.isPremium) {
      const sub = await prisma.subscription.findUnique({
        where: { subscriberId_creatorId: { subscriberId: me.id, creatorId: post.authorId } },
      })
      isSubscribed = sub?.status === 'ACTIVE'
    }

    const isOwn = me?.id === post.authorId
    const isLocked = post.isPremium && !isSubscribed && !isOwn

    return ok({
      ...post,
      isLiked: Array.isArray(post.likes) ? post.likes.length > 0 : false,
      likes: undefined,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLocked,
      content: isLocked ? post.contentPreview : post.content,
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const me = await getCurrentUser()
    if (!me) return notFound('Post')

    const post = await prisma.post.findUnique({ where: { id: params.postId } })
    if (!post || post.authorId !== me.id) return notFound('Post')

    await prisma.post.update({
      where: { id: params.postId },
      data: { isDeleted: true },
    })

    return ok({ deleted: true })
  } catch (error) {
    return handleError(error)
  }
}
