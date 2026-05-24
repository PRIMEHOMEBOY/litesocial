export const dynamic = 'force-dynamic'
// app/api/auth/link-wallet/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ok, err, handleError, generateNonce } from '@/lib/api-helpers'
import { LinkWalletSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  try {
    const me = await requireAuth()
    const body = await req.json()
    const { ltcAddress, signature, nonce } = LinkWalletSchema.parse(body)

    // Check the wallet isn't already linked to another account
    const existing = await prisma.user.findUnique({ where: { ltcAddress } })
    if (existing && existing.id !== me.id) {
      return err('This wallet address is already linked to another account', 409)
    }

    // Verify the nonce was issued for this user and wallet
    const user = await prisma.user.findUnique({ where: { id: me.id } })
    if (!user?.nonce || user.nonce !== nonce) {
      return err('Invalid or expired nonce. Request a new one first.', 401)
    }
    if (user.nonceExpiresAt && user.nonceExpiresAt < new Date()) {
      return err('Nonce expired', 401)
    }

    // TODO: Verify Litecoin message signature with litecore-lib (same as /api/auth/verify)
    const signatureValid = signature.length > 10 // placeholder

    if (!signatureValid) return err('Signature verification failed', 401)

    await prisma.user.update({
      where: { id: me.id },
      data: { ltcAddress, nonce: null, nonceExpiresAt: null },
    })

    return ok({ message: 'Wallet linked successfully', ltcAddress })
  } catch (error) {
    return handleError(error)
  }
}
