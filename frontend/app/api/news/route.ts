// app/api/news/route.ts
import { cacheGet, cacheSet } from '@/lib/redis'
import { ok, handleError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FEEDS = [
  'https://www.coindesk.com/arc/outboundfeeds/rss/',
  'https://cointelegraph.com/rss',
]

function parseRSS(xml: string, source: string) {
  const items: any[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      || block.match(/<title>(.*?)<\/title>/)?.[1] || ''
    const link = block.match(/<link>(.*?)<\/link>/)?.[1]
      || block.match(/<guid>(.*?)<\/guid>/)?.[1] || ''
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
    const desc = block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1]
      || block.match(/<description>(.*?)<\/description>/)?.[1] || ''
    if (title && link) {
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').slice(0, 120),
        link: link.trim(),
        pubDate,
        source,
        desc: desc.replace(/<[^>]+>/g, '').slice(0, 160),
      })
    }
    if (items.length >= 5) break
  }
  return items
}

export async function GET() {
  try {
    const cached = await cacheGet('news:headlines')
    if (cached) return ok({ articles: JSON.parse(cached) })

    const results = await Promise.allSettled(
      FEEDS.map(async (url) => {
        const source = url.includes('coindesk') ? 'CoinDesk' : 'CoinTelegraph'
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        })
        if (!res.ok) throw new Error(`${source} fetch failed`)
        const xml = await res.text()
        return parseRSS(xml, source)
      })
    )

    const articles = results
      .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .slice(0, 8)

    if (articles.length > 0) {
      await cacheSet('news:headlines', JSON.stringify(articles), 600) // 10min cache
    }

    return ok({ articles })
  } catch (error) {
    return handleError(error)
  }
}
