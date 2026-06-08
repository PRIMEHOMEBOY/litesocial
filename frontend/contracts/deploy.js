/**
 * PrimeDesk.sol deployment script for LitVM (Liteforge EVM)
 * Run with: node deploy.js
 */

const { ethers } = require('ethers')
const fs = require('fs')
const path = require('path')

// ─── CONFIG ─────────────────────────────────────────────────────────────────

// LitVM Testnet RPC — check https://docs.liteforge.io for latest
const LITVM_TESTNET_RPC = 'https://rpc.liteforge.io/testnet'
const LITVM_MAINNET_RPC = 'https://rpc.liteforge.io'

const NETWORK = process.env.NETWORK || 'testnet'
const RPC_URL = NETWORK === 'mainnet' ? LITVM_MAINNET_RPC : LITVM_TESTNET_RPC

// Your deployer private key — NEVER commit this
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY

if (!PRIVATE_KEY) {
  console.error('ERROR: Set DEPLOYER_PRIVATE_KEY environment variable')
  console.error('  export DEPLOYER_PRIVATE_KEY=your_private_key_here')
  process.exit(1)
}

// ─── ABI + BYTECODE ──────────────────────────────────────────────────────────
// After compiling with solc, paste the ABI and bytecode here
// Or use: solcjs --abi --bin PrimeDesk.sol

const ABI = [
  "constructor()",
  "function registerCreator(bytes32 usernameHash, uint8 tier, uint256 monthlyPrice, address payoutAddress) payable",
  "function subscribe(bytes32 creatorHash) payable",
  "function tip(bytes32 postIdHash, bytes32 creatorHash) payable",
  "function withdraw(bytes32 usernameHash)",
  "function isSubscribed(address subscriber, bytes32 creatorHash) view returns (bool, uint256)",
  "function getCreator(bytes32 usernameHash) view returns (address, uint256, uint256, bool, uint8, uint256)",
  "function getPostTips(bytes32 postIdHash) view returns (uint256)",
  "function updatePrice(bytes32 usernameHash, uint256 newPrice)",
  "function updatePayoutAddress(bytes32 usernameHash, address newAddress)",
  "function owner() view returns (address)",
  "function BASIC_TIER_FEE() view returns (uint256)",
  "function PRO_TIER_FEE() view returns (uint256)",
  "function ELITE_TIER_FEE() view returns (uint256)",
  "event CreatorRegistered(address indexed creator, bytes32 indexed usernameHash, uint8 tier, uint256 monthlyPrice)",
  "event Subscribed(address indexed subscriber, bytes32 indexed creatorHash, uint256 amount, uint256 expiresAt)",
  "event TipSent(address indexed tipper, bytes32 indexed postIdHash, bytes32 indexed creatorHash, uint256 amount)",
  "event Withdrawn(bytes32 indexed creatorHash, address indexed payoutAddress, uint256 amount)",
]

// Paste compiled bytecode here after running solc
// solcjs --bin PrimeDesk.sol --output-dir ./compiled
const BYTECODE = process.env.CONTRACT_BYTECODE || '0x' // replace with compiled bytecode

async function main() {
  console.log(`\n🚀 Deploying PrimeDesk to LitVM ${NETWORK}...`)
  console.log(`   RPC: ${RPC_URL}\n`)

  const provider = new ethers.JsonRpcProvider(RPC_URL)
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

  console.log(`📬 Deployer address: ${wallet.address}`)

  const balance = await provider.getBalance(wallet.address)
  console.log(`💰 Balance: ${ethers.formatEther(balance)} LTC\n`)

  if (balance === 0n) {
    console.error('ERROR: Deployer has no LTC. Fund your wallet first.')
    process.exit(1)
  }

  if (BYTECODE === '0x') {
    console.error('ERROR: CONTRACT_BYTECODE not set. Compile the contract first.')
    console.error('  See DEPLOYMENT.md for instructions.')
    process.exit(1)
  }

  console.log('📦 Deploying contract...')
  const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet)

  const contract = await factory.deploy({
    gasLimit: 3_000_000,
  })

  console.log(`⏳ Waiting for deployment tx: ${contract.deploymentTransaction()?.hash}`)
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log(`\n✅ PrimeDesk deployed successfully!`)
  console.log(`📄 Contract address: ${address}`)
  console.log(`🔗 Explorer: https://explorer.liteforge.io/address/${address}\n`)

  // Save deployment info
  const deployInfo = {
    network: NETWORK,
    contractAddress: address,
    deployerAddress: wallet.address,
    deployedAt: new Date().toISOString(),
    txHash: contract.deploymentTransaction()?.hash,
  }

  fs.writeFileSync(
    path.join(__dirname, 'deployment.json'),
    JSON.stringify(deployInfo, null, 2)
  )

  console.log('💾 Deployment info saved to contracts/deployment.json')
  console.log('\n📋 Next steps:')
  console.log(`   1. Add to your .env: NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`)
  console.log('   2. Redeploy your Vercel app')
  console.log('   3. Users can now pay on-chain!')
}

main().catch(err => {
  console.error('Deployment failed:', err)
  process.exit(1)
})
