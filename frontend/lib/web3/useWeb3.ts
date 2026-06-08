// lib/web3/useWeb3.ts
// React hook for Web3 wallet connection and contract interactions

'use client'
import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import {
  connectWallet, getWalletAddress, getContract, getReadOnlyContract,
  hashUsername, hashPostId, ltcToWei, weiToLtc, switchToLitVM, NETWORK,
} from './contract'

export type Web3Status = 'disconnected' | 'connecting' | 'connected' | 'error'

export function useWeb3() {
  const [address, setAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<Web3Status>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)

  // Check if already connected on mount
  useEffect(() => {
    getWalletAddress().then(addr => {
      if (addr) { setAddress(addr); setStatus('connected') }
    }).catch(() => {})

    // Listen for account/chain changes
    const win = window as any
    if (win.ethereum) {
      win.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || null)
        setStatus(accounts[0] ? 'connected' : 'disconnected')
      })
      win.ethereum.on('chainChanged', (id: string) => {
        setChainId(id)
      })
    }
  }, [])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    try {
      const addr = await connectWallet()
      setAddress(addr)
      setStatus('connected')
      return addr
    } catch (e: any) {
      setError(e.message)
      setStatus('error')
      throw e
    }
  }, [])

  const isOnLitVM = chainId === NETWORK.chainId

  return { address, status, error, connect, isOnLitVM, switchToLitVM }
}

// ─── CONTRACT ACTION HOOKS ───────────────────────────────────────────────────

export function useSubscribe() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const subscribe = async (creatorUsername: string, priceInLtc: string) => {
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const contract = await getContract(true)
      const creatorHash = hashUsername(creatorUsername)
      const value = ltcToWei(priceInLtc)

      const tx = await contract.subscribe(creatorHash, { value })
      setTxHash(tx.hash)
      await tx.wait(1) // wait 1 confirmation

      // Notify backend of on-chain subscription
      await fetch('/api/subscriptions/on-chain-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ creatorUsername, txHash: tx.hash }),
      })

      return tx.hash
    } catch (e: any) {
      const msg = e?.reason || e?.message || 'Transaction failed'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { subscribe, loading, error, txHash }
}

export function useTip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const sendTip = async (postId: string, creatorUsername: string, amountInLtc: string) => {
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const contract = await getContract(true)
      const postHash = hashPostId(postId)
      const creatorHash = hashUsername(creatorUsername)
      const value = ltcToWei(amountInLtc)

      const tx = await contract.tip(postHash, creatorHash, { value })
      setTxHash(tx.hash)
      await tx.wait(1)

      // Notify backend
      await fetch('/api/tips/on-chain-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ postId, creatorUsername, txHash: tx.hash, amount: amountInLtc }),
      })

      return tx.hash
    } catch (e: any) {
      const msg = e?.reason || e?.message || 'Transaction failed'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { sendTip, loading, error, txHash }
}

export function useWithdraw() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const withdraw = async (username: string) => {
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const contract = await getContract(true)
      const usernameHash = hashUsername(username)

      const tx = await contract.withdraw(usernameHash)
      setTxHash(tx.hash)
      await tx.wait(1)

      // Notify backend
      await fetch('/api/users/me/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ txHash: tx.hash }),
      })

      return tx.hash
    } catch (e: any) {
      const msg = e?.reason || e?.message || 'Transaction failed'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { withdraw, loading, error, txHash }
}

export function useCreatorTier() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const TIER_MAP: Record<string, number> = { BASIC: 1, PRO: 2, ELITE: 3 }
  const TIER_FEES: Record<string, string> = { BASIC: '0.2', PRO: '0.5', ELITE: '1.0' }

  const registerCreator = async (
    username: string,
    tier: 'BASIC' | 'PRO' | 'ELITE',
    monthlyPriceLtc: string,
    payoutAddress: string
  ) => {
    setLoading(true)
    setError(null)
    setTxHash(null)
    try {
      const contract = await getContract(true)
      const usernameHash = hashUsername(username)
      const tierNum = TIER_MAP[tier]
      const monthlyPriceWei = ltcToWei(monthlyPriceLtc)
      const tierFeeWei = ltcToWei(TIER_FEES[tier])

      const tx = await contract.registerCreator(
        usernameHash, tierNum, monthlyPriceWei, payoutAddress,
        { value: tierFeeWei }
      )
      setTxHash(tx.hash)
      await tx.wait(1)

      // Notify backend to update creator status
      await fetch('/api/creator-tier/on-chain-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier, txHash: tx.hash }),
      })

      return tx.hash
    } catch (e: any) {
      const msg = e?.reason || e?.message || 'Transaction failed'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }

  return { registerCreator, loading, error, txHash }
}

export async function checkOnChainSubscription(
  subscriberAddress: string,
  creatorUsername: string
): Promise<{ isSubscribed: boolean; expiresAt: number }> {
  try {
    const contract = await getReadOnlyContract()
    const creatorHash = hashUsername(creatorUsername)
    const [isActive, expiresAt] = await contract.isSubscribed(subscriberAddress, creatorHash)
    return { isSubscribed: isActive, expiresAt: Number(expiresAt) }
  } catch {
    return { isSubscribed: false, expiresAt: 0 }
  }
}

export async function getOnChainCreatorBalance(username: string): Promise<string> {
  try {
    const contract = await getReadOnlyContract()
    const usernameHash = hashUsername(username)
    const [, , , , , pendingBalance] = await contract.getCreator(usernameHash)
    return weiToLtc(pendingBalance)
  } catch {
    return '0'
  }
}
