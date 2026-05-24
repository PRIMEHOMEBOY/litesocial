export const dynamic = 'force-dynamic'
// app/api/posts/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, handleError, extractTags } from '@/lib/api-helpers'
import { CreatePostSchema } from '@/lib/schemas'
import { uploadJsonToIpfs } from '@/lib/ipfs'

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const body = await req.json()
    const data = CreatePostSchema.parse(body)

    const tags = extractTags(data.content)
    const contentPreview = data.content.slice(0, 200)

    // Upload to IPFS
    let ipfsHash: string | null = null
    try {
      ipfsHash = await uploadJsonToIpfs(
        {
          version: '1.0',
          type: 'post',
          authorAddress: me.ltcAddress,
          content: data.content,
          mediaHashes: data.mediaHashes,
          timestamp: Math.floor(Date.now() / 1000),
        },
        `litesocial-post-${Date.now()}`
      )
    } catch (e) {
      console.error('IPFS upload failed, storing in DB only:', e)
    }

    const post = await prisma.post.create({
      data: {
        authorId: me.id,
        content: data.content,
        contentPreview,
        ipfsHash,
        isPremium: data.isPremium,
        mediaHashes: data.mediaHashes,
        tags,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarIpfsHash: true, isVerified: true },
        },
      },
    })

    return ok(post, 201)
  } catch (error) {
    return handleError(error)
  }
}
