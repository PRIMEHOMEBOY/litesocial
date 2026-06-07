// lib/auth.ts
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { prisma } from "./prisma"

const JWT_SECRET = process.env.JWT_SECRET!
const COOKIE_NAME = "litesocial_token"

export interface JwtPayload {
  userId: string
  email?: string
  ltcAddress?: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  })
}

export async function clearAuthCookie() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

export async function getTokenFromCookies(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(COOKIE_NAME)?.value ?? null
}

export async function getCurrentUser() {
  const token = await getTokenFromCookies()
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, email: true, emailVerified: true, username: true,
      displayName: true, bio: true, avatarIpfsHash: true,
      bannerIpfsHash: true, ltcAddress: true, isVerified: true,
      creatorTier: true, subscriptionPrice: true, payoutAddress: true,
      totalEarned: true, showEarnings: true, createdAt: true,
    },
  })
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) throw new Error("UNAUTHORIZED")
  return user
}
