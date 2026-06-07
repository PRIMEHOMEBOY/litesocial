"use client"
// components/wallet/WalletConnect.tsx
import { useWallet } from "@/hooks/useWallet"

export function WalletConnect() {
  const { address, loading, error, connect, disconnect, shortAddress, isConnected } = useWallet()

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
      {isConnected ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-400 font-mono bg-gray-800 px-3 py-1 rounded-full">
            {shortAddress}
          </span>
          <button
            onClick={disconnect}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {loading ? "Connecting..." : "🔗 Connect Wallet"}
        </button>
      )}
    </div>
  )
}
