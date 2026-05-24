// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const password = await bcrypt.hash('Password123!', 12)

  const user1 = await prisma.user.upsert({
    where: { username: 'satoshi_lite' },
    update: {},
    create: {
      email: 'satoshi@litesocial.xyz',
      passwordHash: password,
      emailVerified: true,
      username: 'satoshi_lite',
      displayName: 'Satoshi Lite',
      bio: 'Building the future of decentralized social on Litecoin. 🌐 Creator. Cypherpunk.',
      ltcAddress: 'LKx2Bv9mR4PdQ3yZj8TfNsAqWe7GhMcBv',
      isVerified: true,
      creatorTier: 'ELITE',
      subscriptionPrice: 1.0,
      payoutAddress: 'LKx2Bv9mR4PdQ3yZj8TfNsAqWe7GhMcBv',
      totalEarned: 12.45,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { username: 'ltc_oracle' },
    update: {},
    create: {
      email: 'oracle@litesocial.xyz',
      passwordHash: password,
      emailVerified: true,
      username: 'ltc_oracle',
      displayName: 'LTC Oracle',
      bio: 'On-chain analysis. Litecoin metrics. Privacy advocate. MWEB watcher.',
      ltcAddress: 'LR7mQpH3vN8xJsYtWkAcFd1Eu5oBrCiGn',
      isVerified: true,
      creatorTier: 'PRO',
      subscriptionPrice: 0.5,
      payoutAddress: 'LR7mQpH3vN8xJsYtWkAcFd1Eu5oBrCiGn',
      totalEarned: 6.72,
    },
  })

  await prisma.post.createMany({
    data: [
      {
        authorId: user1.id,
        content: 'Just published my deep-dive into #Litecoin MWEB privacy features. The cryptography behind confidential transactions is genuinely impressive. This is why I am bullish long-term. 🔒',
        contentPreview: 'Just published my deep-dive into #Litecoin MWEB privacy features...',
        isPremium: false,
        tags: ['Litecoin', 'MWEB'],
        likesCount: 247,
        commentsCount: 31,
        tipsTotal: 0.85,
      },
      {
        authorId: user2.id,
        content: '📊 Weekly on-chain snapshot:\n• Active addresses: ↑18% WoW\n• Hash rate: all-time high territory\n• MWEB adoption: 22% of txns\n\nLitecoin is quietly winning the payments race. #LTC',
        contentPreview: '📊 Weekly on-chain snapshot: Active addresses: ↑18% WoW...',
        isPremium: false,
        tags: ['LTC'],
        likesCount: 189,
        commentsCount: 22,
        tipsTotal: 0.31,
      },
    ],
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
