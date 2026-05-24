export const dynamic = 'force-dynamic'
// app/api/auth/login/route.ts
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'
import { ok, err, handleError, rateLimit } from '@/lib/api-helpers'
import { LoginSchema } from '@/lib/schemas'

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 attempts per minute per IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!rateLimit(`login:${ip}`, 10, 60_000)) {
      return err('Too many login attempts. Please wait a minute.', 429)
    }

    const body = await req.json()
    const { email, password } = LoginSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        emailVerified: true,
        username: true,
        displayName: true,
        bio: true,
        avatarIpfsHash: true,
        ltcAddress: true,
        isVerified: true,
        creatorTier: true,
        subscriptionPrice: true,
        payoutAddress: true,
        totalEarned: true,
      },
    })

    if (!user || !user.passwordHash) {
      return err('Invalid email or password', 401)
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return err('Invalid email or password', 401)
    }

    const token = signToken({ userId: user.id, email: user.email! })
    setAuthCookie(token)

    const { passwordHash: _, ...safeUser } = user
    return ok({ user: safeUser })
  } catch (error) {
    return handleError(error)
  }
}
