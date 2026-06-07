// lib/web3/contract.ts
// PrimeDesk smart contract integration

import { ethers } from 'ethers'

// ─── CONFIG ─────────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

export const LITVM_TESTNET = {
  chainId: '0x' + (4441).toString(16), // update with real LitVM chain ID
  chainName: 'LitVM Testnet',
  nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
  rpcUrls: ['https://liteforge.rpc.caldera.xyz/http'],
  blockExplorerUrls: ['https://explorer.liteforge.io'],
}

export const LITVM_MAINNET = {
  chainId: '0x' + (1790).toString(16), // update with real LitVM chain ID
  chainName: 'LitVM',
  nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
  rpcUrls: ['https://rpc.liteforge.io'],
  blockExplorerUrls: ['https://explorer.liteforge.io'],
}

export const NETWORK = process.env.NEXT_PUBLIC_LITVM_NETWORK === 'mainnet'
  ? LITVM_MAINNET
  : LITVM_TESTNET

// ─── ABI ─────────────────────────────────────────────────────────────────────

export const PRIMEDESK_ABI = [
  'function registerCreator(bytes32 usernameHash, uint8 tier, uint256 monthlyPrice, address payoutAddress) payable',
  'function subscribe(bytes32 creatorHash) payable',
  'function tip(bytes32 postIdHash, bytes32 creatorHash) payable',
  'function withdraw(bytes32 usernameHash)',
  'function isSubscribed(address subscriber, bytes32 creatorHash) view returns (bool, uint256)',
  'function getCreator(bytes32 usernameHash) view returns (address, uint256, uint256, bool, uint8, uint256)',
  'function getPostTips(bytes32 postIdHash) view returns (uint256)',
  'function updatePrice(bytes32 usernameHash, uint256 newPrice)',
  'function updatePayoutAddress(bytes32 usernameHash, address newAddress)',
  'function BASIC_TIER_FEE() view returns (uint256)',
  'function PRO_TIER_FEE() view returns (uint256)',
  'function ELITE_TIER_FEE() view returns (uint256)',
  'event Subscribed(address indexed subscriber, bytes32 indexed creatorHash, uint256 amount, uint256 expiresAt)',
  'event TipSent(address indexed tipper, bytes32 indexed postIdHash, bytes32 indexed creatorHash, uint256 amount)',
  'event Withdrawn(bytes32 indexed creatorHash, address indexed payoutAddress, uint256 amount)',
]

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function hashUsername(username: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(username.toLowerCase().trim()))
}

export function hashPostId(postId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(postId))
}

export function ltcToWei(amount: string | number): bigint {
  return ethers.parseEther(String(amount))
}

export function weiToLtc(wei: bigint): string {
  return ethers.formatEther(wei)
}

// ─── PROVIDER HELPERS ────────────────────────────────────────────────────────

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === 'undefined') throw new Error('Not in browser')
  const win = window as any
  if (!win.ethereum) throw new Error('No Web3 wallet found. Install MetaMask or a LitVM-compatible wallet.')
  return new ethers.BrowserProvider(win.ethereum)
}

export async function getSigner(): Promise<ethers.Signer> {
  const provider = await getProvider()
  await switchToLitVM()
  return provider.getSigner()
}

export async function getContract(withSigner = false) {
  if (withSigner) {
    const signer = await getSigner()
    return new ethers.Contract(CONTRACT_ADDRESS, PRIMEDESK_ABI, signer)
  }
  const provider = await getProvider()
  return new ethers.Contract(CONTRACT_ADDRESS, PRIMEDESK_ABI, provider)
}

export async function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(NETWORK.rpcUrls[0])
  return new ethers.Contract(CONTRACT_ADDRESS, PRIMEDESK_ABI, provider)
}

// ─── CHAIN SWITCHING ─────────────────────────────────────────────────────────

export async function switchToLitVM(): Promise<void> {
  const win = window as any
  if (!win.ethereum) throw new Error('No wallet found')

  try {
    await win.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NETWORK.chainId }],
    })
  } catch (switchError: any) {
    // Chain not added yet — add it
    if (switchError.code === 4902) {
      await win.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [NETWORK],
      })
    } else {
      throw switchError
    }
  }
}

export async function connectWallet(): Promise<string> {
  const provider = await getProvider()
  const accounts = await provider.send('eth_requestAccounts', [])
  if (!accounts[0]) throw new Error('No account selected')
  await switchToLitVM()
  return accounts[0]
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const provider = await getProvider()
    const accounts = await provider.send('eth_accounts', [])
    return accounts[0] || null
  } catch {
    return null
  }
}
