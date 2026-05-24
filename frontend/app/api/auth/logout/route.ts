// app/api/auth/logout/route.ts
import { clearAuthCookie } from '@/lib/auth'
import { ok } from '@/lib/api-helpers'

export async function POST() {
  clearAuthCookie()
  return ok({ message: 'Logged out' })
}
