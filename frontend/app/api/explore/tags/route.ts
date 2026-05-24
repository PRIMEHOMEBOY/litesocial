// app/api/explore/tags/route.ts
import { prisma } from '@/lib/prisma'
import { ok, handleError } from '@/lib/api-helpers'

export async function GET() {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Get recent posts and tally their tags
    const posts = await prisma.post.findMany({
      where: { isDeleted: false, createdAt: { gte: since } },
      select: { tags: true },
    })

    const tagCounts = new Map<string, number>()
    for (const post of posts) {
      for (const tag of post.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    const trending = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    return ok({ tags: trending })
  } catch (error) {
    return handleError(error)
  }
}
