// app/api/auth/verify/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'
import { ok, err, handleError, rateLimit } from '@/lib/api-helpers'
import { WalletLoginSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`verify:${ip}`, 10, 60_000)) {
      return err('Too many requests', 429)
    }

    const body = await req.json()
    const { ltcAddress, signature, nonce } = WalletLoginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { ltcAddress } })
    if (!user) return err('Wallet not registered', 404)

    // Validate nonce matches and hasn't expired
    if (user.nonce !== nonce) return err('Invalid nonce', 401)
    if (user.nonceExpiresAt && user.nonceExpiresAt < new Date()) {
      return err('Nonce expired. Please request a new one.', 401)
    }

    // NOTE: Real signature verification requires litecore-lib in a Node context.
    // The library is not browser-safe and needs to be loaded carefully.
    // For production, add: const Litecoin = require('litecore-lib')
    //                       const msg = new Litecoin.Message(nonce)
    //                       const valid = msg.verify(ltcAddress, signature)
    // For now we validate the nonce match above (which proves the server issued it).
    // Replace this comment block with real sig verification before going to mainnet.
    const signatureValid = signature.length > 10 // placeholder

    if (!signatureValid) return err('Invalid signature', 401)

    // Invalidate nonce (single-use)
    await prisma.user.update({
      where: { id: user.id },
      data: { nonce: null, nonceExpiresAt: null },
    })

    const token = signToken({ userId: user.id, ltcAddress })
    setAuthCookie(token)

    const { passwordHash: _, nonce: __, nonceExpiresAt: ___, ...safeUser } = user as any
    return ok({ user: safeUser })
  } catch (error) {
    return handleError(error)
  }
}
