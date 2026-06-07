"use client"
// components/wallet/WithdrawButton.tsx
import { useWallet } from "@/hooks/useWallet"

export function WithdrawButton() {
  const { pendingBalance, withdraw, loading, error, refreshBalance, isConnected, connect } = useWallet()

  const handleWithdraw = async () => {
    if (!isConnected) {
      await connect()
      return
    }
    await withdraw()
    await refreshBalance()
  }

  const hasBalance = parseFloat(pendingBalance) > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-3">
        <div>
          <p className="text-sm text-gray-400">Pending Earnings</p>
          <p className="text-xl font-bold text-white">{parseFloat(pendingBalance).toFixed(6)} LTC</p>
        </div>
        <button
          onClick={handleWithdraw}
          disabled={loading || !hasBalance}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-xl transition-colors"
        >
          {loading ? "Withdrawing..." : "Withdraw"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
