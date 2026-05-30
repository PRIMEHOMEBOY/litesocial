// app/api/users/[username]/posts/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ok, notFound, handleError } from '@/lib/api-helpers'

export async function GET(req: NextRequest, context: { params: Promise<{ username: string }> }) {
  try {
    const me = await getCurrentUser()
    const cursor = req.nextUrl.searchParams.get('cursor')
    const limit = 20

    const author = await prisma.user.findUnique({ where: { username: (await context.params).username } })
    if (!author) return notFound('User')

    // Check if viewer is subscribed to this creator
    let isSubscribed = false
    if (me) {
      const sub = await prisma.subscription.findUnique({
        where: { subscriberId_creatorId: { subscriberId: me.id, creatorId: author.id } },
      })
      isSubscribed = sub?.status === 'ACTIVE'
    }
    const isOwnProfile = me?.id === author.id

    const posts = await prisma.post.findMany({
      where: { authorId: author.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true },
        },
        _count: { select: { likes: true, comments: true } },
        likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
      },
    })

    const hasMore = posts.length > limit
    const items = posts.slice(0, limit).map((post) => ({
      ...post,
      isLiked: post.likes ? post.likes.length > 0 : false,
      likes: undefined,
      isLocked: post.isPremium && !isSubscribed && !isOwnProfile,
      content: post.isPremium && !isSubscribed && !isOwnProfile ? post.contentPreview : post.content,
    }))

    return ok({
      posts: items,
      nextCursor: hasMore ? items[items.length - 1]?.id : null,
    })
  } catch (error) {
    return handleError(error)
  }
}
