export const dynamic = 'force-dynamic'
// app/api/auth/nonce/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, handleError, generateNonce, rateLimit } from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`nonce:${ip}`, 5, 60_000)) {
      return err('Too many requests', 429)
    }

    const address = req.nextUrl.searchParams.get('address')
    if (!address) return err('address is required')

    const nonce = generateNonce(address)
    const nonceExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Upsert user by wallet address — this supports wallet-only login
    await prisma.user.upsert({
      where: { ltcAddress: address },
      create: {
        ltcAddress: address,
        username: `ltc_${address.slice(1, 9).toLowerCase()}`,
        displayName: truncateAddr(address),
        nonce,
        nonceExpiresAt,
        emailVerified: false,
      },
      update: { nonce, nonceExpiresAt },
    })

    return ok({ nonce })
  } catch (error) {
    return handleError(error)
  }
}

function truncateAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
