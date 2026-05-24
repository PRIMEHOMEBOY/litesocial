import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import redis from '../lib/redis.js';
import { logger } from '../lib/logger.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
const NONCE_TTL = 300; // 5 minutes

// ── Wallet Auth ───────────────────────────────────────────────────────────────

export async function generateNonce(ltcAddress) {
  const nonce = `LITESOCIAL:${crypto.randomBytes(8).toString('hex')}:${Date.now()}`;
  // Store nonce in Redis with 5 min TTL
  await redis.setex(`nonce:${ltcAddress}`, NONCE_TTL, nonce);

  // Upsert user
  let user = await prisma.user.findUnique({ where: { ltcAddress } });
  if (!user) {
    const username = `ltc_${ltcAddress.slice(-8).toLowerCase()}`;
    user = await prisma.user.create({
      data: { ltcAddress, username, nonce, nonceExpiry: new Date(Date.now() + NONCE_TTL * 1000) }
    });
  } else {
    await prisma.user.update({
      where: { ltcAddress },
      data: { nonce, nonceExpiry: new Date(Date.now() + NONCE_TTL * 1000) }
    });
  }
  return nonce;
}

export async function verifyWalletSignature(ltcAddress, signature, nonce) {
  // Check nonce in Redis
  const storedNonce = await redis.get(`nonce:${ltcAddress}`);
  if (!storedNonce || storedNonce !== nonce) throw new Error('Invalid or expired nonce');

  // Verify with litecore-lib
  let verified = false;
  try {
    const { default: Litecoin } = await import('litecore-lib');
    const msg = new Litecoin.Message(nonce);
    verified = msg.verify(ltcAddress, signature);
  } catch (e) {
    logger.warn('litecore-lib verification failed, falling back to mock for dev:', e.message);
    // In dev without a real wallet, accept any non-empty signature
    verified = process.env.NODE_ENV === 'development' && signature.length > 0;
  }
  if (!verified) throw new Error('Signature verification failed');

  // Invalidate nonce
  await redis.del(`nonce:${ltcAddress}`);
  await prisma.user.update({ where: { ltcAddress }, data: { nonce: '' } });

  const user = await prisma.user.findUnique({ where: { ltcAddress } });
  return { user, token: issueJwt(user) };
}

// ── Email Auth ────────────────────────────────────────────────────────────────

export async function registerWithEmail(email, password, username) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing?.email === email) throw new Error('Email already registered');
  if (existing?.username === username) throw new Error('Username already taken');

  const passwordHash = await bcrypt.hash(password, 12);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: { email, passwordHash, username, displayName: username, emailVerifyToken }
  });

  await sendVerificationEmail(email, emailVerifyToken, username);
  return { user, token: issueJwt(user) };
}

export async function loginWithEmail(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  return { user, token: issueJwt(user) };
}

export async function verifyEmailToken(token) {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw new Error('Invalid verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null }
  });
  return { user, token: issueJwt(user) };
}

export async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent — don't leak whether email exists

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: resetToken, passwordResetExpiry: expiry }
  });

  await sendPasswordResetEmail(email, resetToken, user.username);
}

export async function resetPassword(token, newPassword) {
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } }
  });
  if (!user) throw new Error('Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null }
  });
  return { user, token: issueJwt(user) };
}

// ── JWT Helpers ───────────────────────────────────────────────────────────────

function issueJwt(user) {
  return jwt.sign(
    { userId: user.id, address: user.ltcAddress, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyJwt(token) {
  return jwt.verify(token, JWT_SECRET);
}

export async function blacklistToken(token) {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return;
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl > 0) await redis.setex(`blacklist:${token}`, ttl, '1');
}

export async function isTokenBlacklisted(token) {
  return !!(await redis.get(`blacklist:${token}`));
}
