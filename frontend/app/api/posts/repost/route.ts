// app/api/posts/repost/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError, extractTags } from '@/lib/api-helpers'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const Schema = z.object({ postId: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const { postId } = Schema.parse(await req.json())

    const original = await prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: { author: { select: { username: true, displayName: true } } },
    })
    if (!original) return err('Post not found', 404)
    if (original.authorId === me.id) return err('Cannot repost your own post', 400)

    // Check not already reposted
    const existing = await prisma.post.findFirst({
      where: { authorId: me.id, content: { contains: `repost:${postId}` } },
    })
    if (existing) return err('Already reposted', 409)

    const repostContent = `↩ Reposted from @${original.author.username}\n\n${original.content}\n\nrepost:${postId}`
    const tags = extractTags(original.content)

    const repost = await prisma.post.create({
      data: {
        authorId: me.id,
        content: repostContent,
        contentPreview: repostContent.slice(0, 200),
        isPremium: false,
        tags,
        mediaHashes: original.mediaHashes,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true } },
      },
    })

    return ok(repost, 201)
  } catch (error) { return handleError(error) }
}
