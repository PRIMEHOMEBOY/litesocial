// lib/web3/contract.ts
import { ethers } from "ethers"

// ---- CONFIG ----
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

export const LITVM_NETWORK = {
  chainId: "0x" + (4441).toString(16), // 0x115D
  chainName: "LitVM Testnet",
  nativeCurrency: { name: "Litecoin", symbol: "LTC", decimals: 18 },
  rpcUrls: ["https://liteforge.rpc.caldera.xyz/http"],
  blockExplorerUrls: ["https://explorer.liteforge.io"],
}

// ---- ABI ----
export const PRIMEDESK_ABI = [
  "function registerCreator(bytes32 usernameHash, uint256 subscriptionPrice, address payoutAddress)",
  "function subscribe(bytes32 creatorHash) payable",
  "function tip(bytes32 creatorHash, bytes32 postIdHash) payable",
  "function withdraw()",
  "function updatePrice(bytes32 usernameHash, uint256 newPrice)",
  "function updatePayoutAddress(bytes32 usernameHash, address newAddress)",
  "function isSubscribed(bytes32 creatorHash, address subscriber) view returns (bool)",
  "function getCreator(bytes32 creatorHash) view returns (address, uint256, bool)",
  "function getPendingBalance(address payoutAddress) view returns (uint256)",
  "event CreatorRegistered(bytes32 indexed creatorHash, address payoutAddress, uint256 price)",
  "event Subscribed(bytes32 indexed creatorHash, address indexed subscriber, uint256 amount)",
  "event TipSent(bytes32 indexed creatorHash, bytes32 indexed postIdHash, address indexed tipper, uint256 amount)",
  "event Withdrawn(address indexed payoutAddress, uint256 amount)",
]

// ---- HELPERS ----
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

// ---- PROVIDER ----
export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (typeof window === "undefined") throw new Error("Not in browser")
  const win = window as any
  if (!win.ethereum) throw new Error("No Web3 wallet found. Please install MetaMask.")
  return new ethers.BrowserProvider(win.ethereum)
}

// ---- SWITCH/ADD NETWORK ----
export async function switchToLitVM(): Promise<void> {
  const win = window as any
  if (!win.ethereum) throw new Error("No wallet found")
  try {
    await win.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LITVM_NETWORK.chainId }],
    })
  } catch (err: any) {
    if (err.code === 4902) {
      await win.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [LITVM_NETWORK],
      })
    } else {
      throw err
    }
  }
}

// ---- CONNECT WALLET ----
export async function connectWallet(): Promise<string> {
  const provider = await getProvider()
  await switchToLitVM()
  const accounts = await provider.send("eth_requestAccounts", [])
  if (!accounts[0]) throw new Error("No account selected")
  return accounts[0]
}

// ---- GET WALLET ADDRESS ----
export async function getWalletAddress(): Promise<string | null> {
  try {
    const provider = await getProvider()
    const accounts = await provider.send("eth_accounts", [])
    return accounts[0] || null
  } catch {
    return null
  }
}

// ---- GET SIGNER ----
export async function getSigner(): Promise<ethers.Signer> {
  const provider = await getProvider()
  await switchToLitVM()
  return provider.getSigner()
}

// ---- GET CONTRACT ----
export async function getContract(withSigner = false) {
  if (withSigner) {
    const signer = await getSigner()
    return new ethers.Contract(CONTRACT_ADDRESS, PRIMEDESK_ABI, signer)
  }
  const provider = new ethers.JsonRpcProvider(LITVM_NETWORK.rpcUrls[0])
  return new ethers.Contract(CONTRACT_ADDRESS, PRIMEDESK_ABI, provider)
}

// ---- REGISTER CREATOR ----
export async function registerCreator(
  username: string,
  subscriptionPriceLTC: string,
  payoutAddress: string
) {
  const contract = await getContract(true)
  const usernameHash = hashUsername(username)
  const price = ltcToWei(subscriptionPriceLTC)
  const tx = await contract.registerCreator(usernameHash, price, payoutAddress)
  await tx.wait()
  return tx.hash
}

// ---- SUBSCRIBE ----
export async function subscribeToCreator(creatorUsername: string, priceLTC: string) {
  const contract = await getContract(true)
  const creatorHash = hashUsername(creatorUsername)
  const tx = await contract.subscribe(creatorHash, { value: ltcToWei(priceLTC) })
  await tx.wait()
  return tx.hash
}

// ---- TIP ----
export async function sendTip(creatorUsername: string, postId: string, amountLTC: string) {
  const contract = await getContract(true)
  const creatorHash = hashUsername(creatorUsername)
  const postIdHash = hashPostId(postId)
  const tx = await contract.tip(creatorHash, postIdHash, { value: ltcToWei(amountLTC) })
  await tx.wait()
  return tx.hash
}

// ---- WITHDRAW ----
export async function withdrawEarnings() {
  const contract = await getContract(true)
  const tx = await contract.withdraw()
  await tx.wait()
  return tx.hash
}

// ---- CHECK SUBSCRIPTION ----
export async function checkIsSubscribed(
  creatorUsername: string,
  subscriberAddress: string
): Promise<boolean> {
  const contract = await getContract(false)
  const creatorHash = hashUsername(creatorUsername)
  return contract.isSubscribed(creatorHash, subscriberAddress)
}

// ---- GET CREATOR INFO ----
export async function getCreatorInfo(creatorUsername: string) {
  const contract = await getContract(false)
  const creatorHash = hashUsername(creatorUsername)
  const [payoutAddress, price, registered] = await contract.getCreator(creatorHash)
  return {
    payoutAddress,
    subscriptionPrice: weiToLtc(price),
    registered,
  }
}

// ---- GET PENDING BALANCE ----
export async function getPendingBalance(payoutAddress: string): Promise<string> {
  const contract = await getContract(false)
  const balance = await contract.getPendingBalance(payoutAddress)
  return weiToLtc(balance)
}
