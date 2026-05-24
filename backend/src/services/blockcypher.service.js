import { logger } from '../lib/logger.js';

const TOKEN = process.env.BLOCKCYPHER_TOKEN;
const NETWORK = process.env.BLOCKCYPHER_NETWORK || 'ltc/test3';
const BASE = `https://api.blockcypher.com/v1/${NETWORK}`;

export async function watchAddress(address) {
  const webhookUrl = process.env.BLOCKCYPHER_WEBHOOK_URL;
  if (!webhookUrl || !TOKEN) {
    logger.warn('BlockCypher not configured — skipping webhook registration');
    return null;
  }
  try {
    const res = await fetch(`${BASE}/hooks?token=${TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'confirmed-tx',
        address,
        url: webhookUrl,
        confirmations: 3,
      }),
    });
    const data = await res.json();
    logger.info(`BlockCypher webhook registered for ${address}: ${data.id}`);
    return data;
  } catch (e) {
    logger.error('BlockCypher watchAddress error:', e.message);
    return null;
  }
}

export async function deleteWebhook(hookId) {
  if (!TOKEN || !hookId) return;
  try {
    await fetch(`${BASE}/hooks/${hookId}?token=${TOKEN}`, { method: 'DELETE' });
  } catch (e) {
    logger.error('BlockCypher deleteWebhook error:', e.message);
  }
}

export async function getAddressBalance(address) {
  try {
    const res = await fetch(`${BASE}/addrs/${address}/balance?token=${TOKEN}`);
    return res.json();
  } catch (e) {
    logger.error('BlockCypher getBalance error:', e.message);
    return null;
  }
}
