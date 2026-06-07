"use client"
// components/creator/RegisterCreatorForm.tsx
import { useState } from "react"
import { useWallet } from "@/hooks/useWallet"
import { registerCreator } from "@/lib/web3/contract"

interface RegisterCreatorFormProps {
  username: string
  onSuccess?: () => void
}

export function RegisterCreatorForm({ username, onSuccess }: RegisterCreatorFormProps) {
  const { isConnected, connect, address } = useWallet()
  const [price, setPrice] = useState("")
  const [payoutAddress, setPayoutAddress] = useState(address || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleRegister = async () => {
    if (!price || parseFloat(price) < 0) {
      setError("Enter a valid subscription price (0 for free)")
      return
    }
    if (!payoutAddress) {
      setError("Enter a payout address")
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (!isConnected) await connect()
      const txHash = await registerCreator(username, price, payoutAddress)
      setSuccess(`Registered! TX: ${txHash.slice(0, 10)}...`)
      onSuccess?.()
    } catch (e: any) {
      setError(e.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 bg-gray-800 rounded-2xl p-5">
      <h3 className="text-lg font-bold text-white">Register as Creator On-Chain</h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-400">Subscription Price (LTC)</label>
        <input
          type="number"
          placeholder="e.g. 0.5"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
          min="0"
          step="0.01"
        />
        <p className="text-xs text-gray-500">Set to 0 for a free subscription</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-400">Payout Wallet Address</label>
        <input
          type="text"
          placeholder="0x..."
          value={payoutAddress}
          onChange={(e) => setPayoutAddress(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-gray-500">Earnings will be sent here</p>
      </div>

      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? "Registering..." : "Register as Creator"}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}
    </div>
  )
}
