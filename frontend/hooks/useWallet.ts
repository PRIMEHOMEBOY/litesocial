"use client"
// hooks/useWallet.ts
import { useState, useEffect, useCallback } from "react"
import {
  connectWallet,
  getWalletAddress,
  switchToLitVM,
  getPendingBalance,
  withdrawEarnings,
  LITVM_NETWORK,
} from "@/lib/web3/contract"

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingBalance, setPendingBalance] = useState<string>("0")

  // Check if already connected on mount
  useEffect(() => {
    getWalletAddress().then(setAddress)

    const win = window as any
    if (win.ethereum) {
      win.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAddress(accounts[0] || null)
      })
      win.ethereum.on("chainChanged", () => window.location.reload())
    }
  }, [])

  // Fetch pending balance when address changes
  useEffect(() => {
    if (address) {
      getPendingBalance(address).then(setPendingBalance).catch(() => {})
    }
  }, [address])

  const connect = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const addr = await connectWallet()
      setAddress(addr)
      return addr
    } catch (e: any) {
      setError(e.message || "Failed to connect wallet")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
  }, [])

  const withdraw = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const txHash = await withdrawEarnings()
      setPendingBalance("0")
      return txHash
    } catch (e: any) {
      setError(e.message || "Withdraw failed")
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshBalance = useCallback(async () => {
    if (address) {
      const bal = await getPendingBalance(address)
      setPendingBalance(bal)
    }
  }, [address])

  return {
    address,
    loading,
    error,
    pendingBalance,
    connect,
    disconnect,
    withdraw,
    refreshBalance,
    isConnected: !!address,
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
  }
}
