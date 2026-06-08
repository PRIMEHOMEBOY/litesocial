# PrimeDesk Smart Contract — Deployment Guide

## Prerequisites
- Node.js installed in Termux
- LitVM wallet with testnet LTC
- Solidity compiler (solcjs)

---

## Step 1 — Install tools in Termux

```bash
cd ~/primedesk/frontend
npm install ethers
npm install -g solc
```

---

## Step 2 — Compile the contract

```bash
cd ~/primedesk/frontend/contracts
solcjs --abi --bin PrimeDesk.sol --output-dir ./compiled
```

This creates two files in `./compiled/`:
- `PrimeDesk_sol_PrimeDesk.abi` — the ABI
- `PrimeDesk_sol_PrimeDesk.bin` — the bytecode

---

## Step 3 — Set your deployer private key

```bash
export DEPLOYER_PRIVATE_KEY=your_private_key_here
export CONTRACT_BYTECODE=$(cat ./compiled/PrimeDesk_sol_PrimeDesk.bin)
```

⚠️ NEVER share your private key or commit it to GitHub.

---

## Step 4 — Deploy to LitVM Testnet

```bash
cd ~/primedesk/frontend/contracts
node deploy.js
```

If successful you'll see:
```
✅ PrimeDesk deployed successfully!
📄 Contract address: 0x...
```

The address is saved to `contracts/deployment.json`.

---

## Step 5 — Add contract address to Vercel

1. Go to Vercel → your project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` = `0x...` (your deployed address)
   - `NEXT_PUBLIC_LITVM_NETWORK` = `testnet` (or `mainnet`)
3. Redeploy

---

## Step 6 — Verify on LiteForge Explorer

Visit: `https://explorer.liteforge.io/address/YOUR_CONTRACT_ADDRESS`

You should see the contract deployed with all functions available.

---

## LitVM Network Details

| Network  | Chain ID | RPC URL                          |
|----------|----------|----------------------------------|
| Testnet  | TBD      | https://rpc.liteforge.io/testnet |
| Mainnet  | TBD      | https://rpc.liteforge.io         |

Check https://docs.liteforge.io for the latest chain IDs and RPC URLs.
Update `lib/web3/contract.ts` with the correct values before deploying.

---

## Contract Functions Summary

| Function | Who calls it | What it does |
|---|---|---|
| `registerCreator()` | Creator | Pays tier fee, gets verified status |
| `subscribe()` | Subscriber | Pays monthly fee, gets 30-day access |
| `tip()` | Anyone | Tips a post, funds go to creator |
| `withdraw()` | Creator | Withdraws all pending earnings |
| `isSubscribed()` | Anyone | Checks if address is subscribed |
| `getCreator()` | Anyone | Gets creator info + balance |
