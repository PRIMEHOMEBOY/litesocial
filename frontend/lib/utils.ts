// lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(addr: string, chars = 6): string {
  if (!addr) return ''
  return `${addr.slice(0, chars)}...${addr.slice(-4)}`
}

export function formatLtc(amount: string | number, decimals = 4): string {
  const n = parseFloat(String(amount))
  if (isNaN(n)) return '0.0000 LTC'
  return `${n.toFixed(decimals)} LTC`
}

export function formatUsd(ltc: string | number, price: number): string {
  return `$${(parseFloat(String(ltc)) * price).toFixed(2)}`
}

export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[a-zA-Z0-9_]+/g) || []
  return [...new Set(matches.map((t) => t.slice(1)))].slice(0, 10)
}

export function validateLtcAddress(address: string): boolean {
  return /^[LMQm][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)
}

export function getIpfsUrl(hash?: string | null): string | null {
  if (!hash) return null
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'
  return `${gateway}/ipfs/${hash}`
}

export function shortenNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
