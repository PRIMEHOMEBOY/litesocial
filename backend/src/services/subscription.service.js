import Decimal from 'decimal.js';
import prisma from '../lib/prisma.js';
import { satoshisToLtc } from './wallet.service.js';
import { sendPaymentConfirmationEmail } from './email.service.js';
import { logger } from '../lib/logger.js';

export async function handleSubscriptionWebhook(payload) {
  const { addresses, total, confirmations, hash } = payload;

  if (!confirmations || confirmations < 3) {
    logger.info(`Webhook: tx ${hash} has ${confirmations} confirmations, waiting`);
    return;
  }

  const incomingAddress = addresses?.[0];
  if (!incomingAddress) return;

  const depositRecord = await prisma.depositAddress.findUnique({
    where: { address: incomingAddress }
  });
  if (!depositRecord || depositRecord.isUsed) return;

  const subscription = await prisma.subscription.findUnique({
    where: { id: depositRecord.refId },
    include: { creator: true, subscriber: true }
  });
  if (!subscription || subscription.status !== 'PENDING') return;

  // Verify amount with 1% tolerance
  const receivedLtc = new Decimal(satoshisToLtc(total));
  const expectedLtc = new Decimal(subscription.priceAtTime.toString());
  const tolerance = expectedLtc.mul(0.01);

  if (receivedLtc.lt(expectedLtc.minus(tolerance))) {
    logger.warn(`Underpayment: got ${receivedLtc} LTC, expected ${expectedLtc} LTC for sub ${subscription.id}`);
    return;
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'ACTIVE', confirmedAt: new Date(), expiresAt, txHash: hash }
    }),
    prisma.depositAddress.update({
      where: { id: depositRecord.id },
      data: { isUsed: true }
    }),
    prisma.user.update({
      where: { id: subscription.creatorId },
      data: { totalEarned: { increment: receivedLtc.toNumber() } }
    }),
    prisma.notification.create({
      data: {
        userId: subscription.creatorId,
        type: 'PAYMENT_RECEIVED',
        fromUser: subscription.subscriber.ltcAddress || subscription.subscriber.username,
        refId: subscription.id,
        message: `You received ${receivedLtc.toFixed(4)} LTC from @${subscription.subscriber.username}`
      }
    }),
    prisma.notification.create({
      data: {
        userId: subscription.subscriberId,
        type: 'NEW_SUBSCRIBER',
        refId: subscription.id,
        message: `Your subscription to @${subscription.creator.username} is now active!`
      }
    }),
  ]);

  // Send email if subscriber has email
  if (subscription.subscriber.email) {
    await sendPaymentConfirmationEmail(
      subscription.subscriber.email,
      receivedLtc.toFixed(4),
      subscription.creator.displayName || subscription.creator.username,
      expiresAt
    );
  }

  logger.info(`Subscription ${subscription.id} activated via tx ${hash}`);
}

export async function handleTipWebhook(payload) {
  const { addresses, total, confirmations, hash } = payload;
  if (!confirmations || confirmations < 3) return;

  const incomingAddress = addresses?.[0];
  if (!incomingAddress) return;

  const depositRecord = await prisma.depositAddress.findUnique({
    where: { address: incomingAddress }
  });
  if (!depositRecord || depositRecord.isUsed || depositRecord.purpose !== 'tip') return;

  const post = await prisma.post.findUnique({
    where: { id: depositRecord.refId },
    include: { author: true }
  });
  if (!post) return;

  const amount = new Decimal(satoshisToLtc(total));

  await prisma.$transaction([
    prisma.tip.create({
      data: {
        postId: post.id,
        tipperId: depositRecord.userId,
        recipientId: post.authorId,
        amount: amount.toNumber(),
        txHash: hash,
      }
    }),
    prisma.post.update({
      where: { id: post.id },
      data: { tipsTotal: { increment: amount.toNumber() } }
    }),
    prisma.user.update({
      where: { id: post.authorId },
      data: { totalEarned: { increment: amount.toNumber() } }
    }),
    prisma.depositAddress.update({
      where: { id: depositRecord.id },
      data: { isUsed: true }
    }),
    prisma.notification.create({
      data: {
        userId: post.authorId,
        type: 'NEW_TIP',
        fromUser: depositRecord.userId,
        refId: post.id,
        message: `You received a tip of ${amount.toFixed(4)} LTC on your post`
      }
    }),
  ]);

  logger.info(`Tip ${amount.toFixed(4)} LTC confirmed on post ${post.id}`);
}
