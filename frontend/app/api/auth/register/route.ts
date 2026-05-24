// app/api/auth/register/route.ts
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth'
import { ok, err, handleError, generateToken } from '@/lib/api-helpers'
import { RegisterSchema } from '@/lib/schemas'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = RegisterSchema.parse(body)

    // Check uniqueness
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: data.email } }),
      prisma.user.findUnique({ where: { username: data.username } }),
    ])

    if (existingEmail) return err('Email already in use', 409)
    if (existingUsername) return err('Username already taken', 409)

    const passwordHash = await bcrypt.hash(data.password, 12)
    const emailVerifyToken = generateToken()

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        username: data.username,
        displayName: data.displayName || data.username,
        emailVerifyToken,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        username: true,
        displayName: true,
        ltcAddress: true,
        isVerified: true,
        creatorTier: true,
        subscriptionPrice: true,
        totalEarned: true,
      },
    })

    // Send verification email (non-blocking)
    sendVerificationEmail(data.email, emailVerifyToken).catch(console.error)

    const token = signToken({ userId: user.id, email: user.email! })
    setAuthCookie(token)

    return ok({ user, message: 'Account created. Check your email to verify.' }, 201)
  } catch (error) {
    return handleError(error)
  }
}
