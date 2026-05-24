// lib/api-helpers.ts
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function notFound(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return err(error.errors[0]?.message || 'Validation error', 400)
  }
  if (error instanceof Error) {
    if (error.message === 'UNAUTHORIZED') return unauthorized()
    console.error('API error:', error)
    return err(error.message || 'Internal server error', 500)
  }
  return err('Internal server error', 500)
}

// Extract hashtags from post content
export function extractTags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z0-9_]+/g) || []
  return [...new Set(matches.map(t => t.slice(1).toLowerCase()))].slice(0, 10)
}

// Generate a random nonce string
export function generateNonce(address: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  const ts = Date.now()
  return `LITESOCIAL:${address.slice(0, 6)}:${random}:${ts}`
}

// Generate a secure random token
export function generateToken(length = 48): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)]
  }
  return token
}

// Rate limiting (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const existing = rateLimitMap.get(key)

  if (!existing || existing.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (existing.count >= maxRequests) return false // blocked

  existing.count++
  return true // allowed
}
