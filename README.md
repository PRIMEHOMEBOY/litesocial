# LiteSocial — Deployment Guide

Decentralized Social-Fi platform on Litecoin. Email + wallet auth, IPFS content, on-chain subscriptions and tips.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Database | PostgreSQL via Prisma |
| Cache | Upstash Redis |
| Auth | Email/bcrypt + LTC wallet signing (JWT, httpOnly cookie) |
| Payments | BlockCypher webhooks (Litecoin) |
| Content | Pinata IPFS |
| Email | Resend |
| Deploy | Vercel |

---

## 1. Prerequisites

- Node.js 18+
- A Vercel account (free tier works)
- A PostgreSQL database (free options below)
- Git

---

## 2. Get a PostgreSQL database (pick one)

**Option A — Neon (recommended, free tier)**
1. Sign up at https://neon.tech
2. Create a new project → copy DATABASE_URL and DIRECT_URL

**Option B — Supabase**
1. Sign up at https://supabase.com
2. Project → Settings → Database → copy connection strings

**Option C — Railway**
1. https://railway.app → New → PostgreSQL
2. Copy connection string

---

## 3. Get Redis (Upstash — free tier)

1. Sign up at https://upstash.com
2. Create Redis database → copy REDIS_URL (starts with rediss://)

---

## 4. Get API keys

**Resend (email) — free: 3000 emails/month**
1. https://resend.com → add your domain or use sandbox
2. Copy API key

**BlockCypher (Litecoin payments) — free: 200 req/hr**
1. https://accounts.blockcypher.com/tokens
2. Copy your token
3. Start with ltc/test3 (testnet) — switch to ltc/main for production

**Pinata (IPFS) — free: 1GB**
1. https://pinata.cloud → API Keys → New Key
2. Copy API Key and Secret Key

---

## 5. Local setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in all values in .env.local

npm run db:push        # Push schema to DB
npm run db:seed        # Optional: seed sample data
npm run dev            # http://localhost:3000
```

---

## 6. Deploy to Vercel

**Option A — Vercel CLI**
```bash
npm install -g vercel
cd litesocial
vercel
```

**Option B — GitHub import**
1. Push repo to GitHub
2. Go to https://vercel.com/new → Import repository
3. Set Root Directory to: frontend
4. Framework: Next.js (auto-detected)
5. Add environment variables (step 7)
6. Deploy

---

## 7. Environment variables in Vercel

Go to: Vercel project → Settings → Environment Variables

```
DATABASE_URL                postgresql://...
DIRECT_URL                  postgresql://...
REDIS_URL                   rediss://...
JWT_SECRET                  (run: openssl rand -base64 64)
NEXT_PUBLIC_APP_URL         https://your-app.vercel.app
RESEND_API_KEY              re_...
EMAIL_FROM                  LiteSocial <noreply@yourdomain.com>
BLOCKCYPHER_TOKEN           your-token
BLOCKCYPHER_NETWORK         ltc/test3
BLOCKCYPHER_WEBHOOK_URL     https://your-app.vercel.app/api/subscriptions/webhook
LTC_MASTER_XPUB             xpub6C...
PINATA_API_KEY              ...
PINATA_SECRET_KEY           ...
NEXT_PUBLIC_PINATA_GATEWAY  https://gateway.pinata.cloud
COINGECKO_API_KEY           (optional)
```

After adding env vars, redeploy the project.

---

## 8. Run database migrations after deploy

```bash
# From local machine with DATABASE_URL pointing to production:
cd frontend
npx prisma migrate deploy
```

Or add to Vercel Build Command:
  prisma migrate deploy && next build

---

## 9. BlockCypher webhook setup

Once deployed, register the webhook:

```bash
curl -X POST https://api.blockcypher.com/v1/ltc/test3/hooks?token=YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "event": "confirmed-tx",
    "url": "https://your-app.vercel.app/api/subscriptions/webhook?token=YOUR_TOKEN"
  }'
```

The app also registers per-address webhooks automatically when subscriptions are initiated.

---

## 10. HD Wallet for deposit addresses (production)

1. Go to https://iancoleman.io/bip39/ (use offline)
2. Generate 24-word mnemonic
3. Set coin to LTC, copy Account Extended Public Key (xpub...)
4. Set LTC_MASTER_XPUB in Vercel
5. NEVER commit the mnemonic or private key

Install and use for real derivation in lib/blockcypher.ts:
```bash
npm install bitcore-lib-ltc
```
```typescript
import Litecoin from 'bitcore-lib-ltc'
export function generateDepositAddress(index: number) {
  const hdPub = new Litecoin.HDPublicKey(process.env.LTC_MASTER_XPUB!)
  const derived = hdPub.derive(`m/0/${index}`)
  return { address: new Litecoin.Address(derived.publicKey).toString() }
}
```

---

## 11. Litecoin signature verification (production)

In app/api/auth/verify/route.ts and app/api/auth/link-wallet/route.ts,
replace the placeholder with real verification:

```bash
npm install bitcore-lib-ltc bitcore-message-litecoin
```
```typescript
import Litecoin from 'bitcore-lib-ltc'
import Message from 'bitcore-message-litecoin'

const msg = new Message(nonce)
const signatureValid = msg.verify(ltcAddress, signature)
```

---

## 12. Switch to Litecoin mainnet

1. Set BLOCKCYPHER_NETWORK=ltc/main
2. Use real LTC addresses (start with L or M)
3. Generate mainnet xpub
4. Test with a tiny amount first

---

## File structure

```
litesocial/
├── README.md
├── vercel.json
├── package.json
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── .env.example
    ├── prisma/
    │   ├── schema.prisma       Full DB schema (User, Post, Subscription, Tip, etc.)
    │   └── seed.ts             Sample creator data
    ├── app/
    │   ├── layout.tsx          Root layout + Google Fonts
    │   ├── page.tsx            Landing page
    │   ├── globals.css         Design tokens + ls-input/ls-btn utilities
    │   ├── providers.tsx       React Query + auth hydration
    │   ├── (auth)/             Login, Register, Connect Wallet pages
    │   ├── (app)/              Auth-gated pages (Home, Explore, Notifications, Settings, Profile)
    │   └── api/
    │       ├── auth/           register, login, logout, me, nonce, verify, link-wallet
    │       ├── posts/          route, feed, explore, [postId]/like, [postId]/comments
    │       ├── users/          [username], posts, follow, search, me, earnings
    │       ├── subscriptions/  initiate, status/[creator], webhook
    │       ├── tips/           initiate, webhook
    │       ├── notifications/  list, read, unread-count
    │       ├── explore/        tags, creators
    │       └── wallet/         ltcprice
    ├── components/
    │   ├── ui/                 Modal, Avatar, FormField
    │   ├── layout/             Sidebar, RightPanel, MobileNav, PageHeader
    │   ├── feed/               PostCard, PostComposer
    │   ├── subscription/       SubscribeModal, TipModal
    │   ├── creator/            CreatorCard
    │   └── wallet/             LinkWalletSection
    ├── lib/
    │   ├── prisma.ts           DB singleton
    │   ├── redis.ts            Upstash Redis + in-memory fallback
    │   ├── auth.ts             JWT, cookies, requireAuth, getCurrentUser
    │   ├── email.ts            Resend transactional emails
    │   ├── blockcypher.ts      LTC blockchain + webhook API
    │   ├── ipfs.ts             Pinata upload (JSON + files)
    │   ├── api-client.ts       Typed frontend fetch wrapper
    │   ├── api-helpers.ts      ok/err helpers, rate limiter, token generator
    │   ├── schemas.ts          Zod schemas for all inputs
    │   └── utils.ts            timeAgo, formatLtc, truncateAddress, renderContent
    └── store/
        ├── useAuthStore.ts     Zustand: user session, fetchMe, logout, updateUser
        └── useWalletStore.ts   Zustand: LTC/USD price with 60s cache
```
