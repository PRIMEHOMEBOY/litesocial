// lib/blockcypher.ts
import Decimal from 'decimal.js'

const TOKEN = process.env.BLOCKCYPHER_TOKEN
const NETWORK = process.env.BLOCKCYPHER_NETWORK || 'ltc/test3'
const BASE = `https://api.blockcypher.com/v1/${NETWORK}`

export function satoshisToLtc(satoshis: number): Decimal {
  return new Decimal(satoshis).div(100_000_000)
}

export async function getAddressBalance(address: string) {
  const res = await fetch(`${BASE}/addrs/${address}/balance?token=${TOKEN}`)
  if (!res.ok) throw new Error(`BlockCypher error: ${res.status}`)
  return res.json()
}

export async function watchAddress(address: string, webhookUrl: string): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/hooks?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'confirmed-tx',
      address,
      url: webhookUrl,
      confirmations: 3,
    }),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`BlockCypher webhook error: ${errText}`)
  }
  return res.json()
}

export async function deleteWebhook(hookId: string) {
  await fetch(`${BASE}/hooks/${hookId}?token=${TOKEN}`, { method: 'DELETE' })
}

/**
 * Generate a deposit address for a given derivation index.
 *
 * PRODUCTION — replace this stub with real HD derivation:
 *   npm install bitcore-lib-ltc
 *
 *   import Litecoin from 'bitcore-lib-ltc'
 *   const hdPub = new Litecoin.HDPublicKey(process.env.LTC_MASTER_XPUB!)
 *   const derived = hdPub.derive(`m/0/${index}`)
 *   return { address: new Litecoin.Address(derived.publicKey).toString() }
 */
export function generateDepositAddress(index: number): { address: string } {
  const xpub = process.env.LTC_MASTER_XPUB
  const prefix = NETWORK === 'ltc/main' ? 'L' : 'Q'

  if (!xpub || xpub.startsWith('xpub6C...')) {
    const suffix = String(index).padStart(8, '0')
    return { address: `${prefix}TestDeposit${suffix}LiteSocial` }
  }

  // Deterministic placeholder until bitcore-lib-ltc is installed
  const seed = xpub.slice(-12) + index
  const h = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0)
  return { address: `${prefix}Hd${String(h % 10000000).padStart(7, '0')}Idx${index}` }
}
