// app/api/wallet/ltcprice/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { ok, handleError } from '@/lib/api-helpers'

export async function GET() {
  try {
    // Try CoinGecko first
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PrimeDesk/1.0',
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      }
    )

    if (res.ok) {
      const data = await res.json()
      const price = data?.litecoin?.usd
      const change24h = data?.litecoin?.usd_24h_change

      if (price) {
        return ok({ price: Number(price.toFixed(2)), change24h: Number((change24h || 0).toFixed(2)) })
      }
    }

    // Fallback: CryptoCompare (no API key needed)
    const fallback = await fetch(
      'https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD',
      { signal: AbortSignal.timeout(6000), cache: 'no-store' }
    )
    if (fallback.ok) {
      const d = await fallback.json()
      if (d?.USD) return ok({ price: Number(d.USD.toFixed(2)), change24h: 0 })
    }

    return ok({ price: null, change24h: 0 })
  } catch (error) {
    // Last resort fallback
    try {
      const res = await fetch('https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD', { cache: 'no-store' })
      const d = await res.json()
      if (d?.USD) return ok({ price: Number(d.USD.toFixed(2)), change24h: 0 })
    } catch {}
    return ok({ price: null, change24h: 0 })
  }
}
