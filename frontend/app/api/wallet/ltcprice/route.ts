// app/api/wallet/ltcprice/route.ts
import { cacheGet, cacheSet } from '@/lib/redis'
import { ok, handleError } from '@/lib/api-helpers'

const CACHE_KEY = 'ltc:price'
const CACHE_TTL = 60 // seconds

export async function GET() {
  try {
    // Try cache first
    const cached = await cacheGet(CACHE_KEY)
    if (cached) return ok(JSON.parse(cached))

    // Fetch from CoinGecko
    const apiKey = process.env.COINGECKO_API_KEY
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true${apiKey ? `&x_cg_demo_api_key=${apiKey}` : ''}`

    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error('CoinGecko fetch failed')

    const data = await res.json()
    const price = data.litecoin?.usd || 0
    const change24h = data.litecoin?.usd_24h_change || 0

    const result = { price, change24h }
    await cacheSet(CACHE_KEY, JSON.stringify(result), CACHE_TTL)

    return ok(result)
  } catch (error) {
    // Return last cached price or fallback
    const cached = await cacheGet(CACHE_KEY).catch(() => null)
    if (cached) return ok(JSON.parse(cached))
    return ok({ price: 0, change24h: 0 })
  }
}
