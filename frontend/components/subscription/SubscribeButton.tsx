"use client"
// components/subscription/SubscribeButton.tsx
import { useState, useEffect } from "react"
import { useWallet } from "@/hooks/useWallet"
import { subscribeToCreator, checkIsSubscribed, getCreatorInfo } from "@/lib/web3/contract"

interface SubscribeButtonProps {
  creatorUsername: string
}

export function SubscribeButton({ creatorUsername }: SubscribeButtonProps) {
  const { isConnected, connect, address } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [price, setPrice] = useState<string | null>(null)

  useEffect(() => {
    getCreatorInfo(creatorUsername)
      .then((info) => {
        if (info.registered) setPrice(info.subscriptionPrice)
      })
      .catch(() => {})
  }, [creatorUsername])

  useEffect(() => {
    if (address) {
      checkIsSubscribed(creatorUsername, address)
        .then(setIsSubscribed)
        .catch(() => {})
    }
  }, [address, creatorUsername])

  const handleSubscribe = async () => {
    if (!price) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (!isConnected) await connect()
      const txHash = await subscribeToCreator(creatorUsername, price)
      setIsSubscribed(true)
      setSuccess(`Subscribed! TX: ${txHash.slice(0, 10)}...`)
    } catch (e: any) {
      setError(e.message || "Subscription failed")
    } finally {
      setLoading(false)
    }
  }

  if (isSubscribed) {
    return (
      <span className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
        ✓ Subscribed
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleSubscribe}
        disabled={loading || !price}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl transition-colors"
      >
        {loading ? "Processing..." : price ? `Subscribe · ${parseFloat(price).toFixed(4)} LTC` : "Subscribe"}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}
    </div>
  )
}
