// lib/auth.ts
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = 'litesocial_token'

export interface JwtPayload {
  userId: string
  email?: string
  ltcAddress?: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  })
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME)
}

export function getTokenFromCookies(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null
}

export async function getCurrentUser() {
  const token = getTokenFromCookies()
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      username: true,
      displayName: true,
      bio: true,
      avatarIpfsHash: true,
      bannerIpfsHash: true,
      ltcAddress: true,
      isVerified: true,
      creatorTier: true,
      subscriptionPrice: true,
      payoutAddress: true,
      totalEarned: true,
      createdAt: true,
    },
  })
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}
