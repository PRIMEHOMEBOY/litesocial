"use client"
// components/wallet/TipButton.tsx
import { useState } from "react"
import { useWallet } from "@/hooks/useWallet"
import { sendTip } from "@/lib/web3/contract"

interface TipButtonProps {
  creatorUsername: string
  postId: string
}

export function TipButton({ creatorUsername, postId }: TipButtonProps) {
  const { isConnected, connect, address } = useWallet()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showInput, setShowInput] = useState(false)

  const handleTip = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Enter a valid amount")
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (!isConnected) await connect()
      const txHash = await sendTip(creatorUsername, postId, amount)
      setSuccess(`Tip sent! TX: ${txHash.slice(0, 10)}...`)
      setAmount("")
      setShowInput(false)
    } catch (e: any) {
      setError(e.message || "Tip failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
        >
          💰 Send Tip
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="LTC amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            min="0"
            step="0.01"
          />
          <button
            onClick={handleTip}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            {loading ? "..." : "Send"}
          </button>
          <button
            onClick={() => setShowInput(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">{success}</p>}
    </div>
  )
}
