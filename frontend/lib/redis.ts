// lib/redis.ts
import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis }

function createRedis() {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('REDIS_URL not set — using in-memory fallback (not suitable for production)')
    return null
  }
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    tls: url.startsWith('rediss://') ? {} : undefined,
  })
  client.on('error', (err) => console.error('Redis error:', err))
  return client
}

export const redis = globalForRedis.redis || createRedis()
if (redis && process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Simple in-memory fallback for when Redis is unavailable
const memoryStore = new Map<string, { value: string; expires?: number }>()

export async function cacheGet(key: string): Promise<string | null> {
  if (redis) return redis.get(key)
  const item = memoryStore.get(key)
  if (!item) return null
  if (item.expires && item.expires < Date.now()) { memoryStore.delete(key); return null }
  return item.value
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (redis) {
    if (ttlSeconds) await redis.setex(key, ttlSeconds, value)
    else await redis.set(key, value)
    return
  }
  memoryStore.set(key, { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined })
}

export async function cacheDel(key: string): Promise<void> {
  if (redis) { await redis.del(key); return }
  memoryStore.delete(key)
}
