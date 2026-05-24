import prisma from '../lib/prisma.js';
import redis from '../lib/redis.js';
import { logger } from '../lib/logger.js';

// ── HD Wallet Address Generation ─────────────────────────────────────────────
// Derives child addresses from master xpub using litecore-lib
// Same xpub + index always gives same address (deterministic)

export async function generateDepositAddress(purpose, refId, userId) {
  // Get next index atomically
  const index = await redis.incr('ltc:address:index');

  let address;
  try {
    const { default: Litecoin } = await import('litecore-lib');
    const hdPublicKey = new Litecoin.HDPublicKey(process.env.LTC_MASTER_XPUB);
    const derived = hdPublicKey.derive(`m/0/${index}`);
    address = derived.publicKey.toAddress(Litecoin.Networks.livenet).toString();
  } catch (e) {
    logger.warn('litecore-lib HD derivation failed (dev mode):', e.message);
    // Dev fallback — fake deterministic address
    address = `Ldev${index.toString().padStart(4, '0')}${userId.slice(-8)}${refId.slice(-8)}`;
  }

  await prisma.depositAddress.create({
    data: { address, purpose, refId, userId }
  });

  return address;
}

// ── LTC Price ─────────────────────────────────────────────────────────────────

export async function getLtcPrice() {
  const cached = await redis.get('ltc:price:usd');
  if (cached) return parseFloat(cached);

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd');
    const data = await res.json();
    const price = data?.litecoin?.usd;
    if (price) {
      await redis.setex('ltc:price:usd', 60, price.toString());
      return price;
    }
  } catch (e) {
    logger.error('Failed to fetch LTC price:', e.message);
  }
  return null;
}

export function satoshisToLtc(satoshis) {
  return satoshis / 100_000_000;
}
