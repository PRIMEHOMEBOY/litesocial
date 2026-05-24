// store/useWalletStore.ts
import { create } from 'zustand'
import { api } from '@/lib/api-client'

interface WalletStore {
  ltcPrice: number | null
  change24h: number | null
  lastFetched: number | null
  fetchPrice: () => Promise<void>
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  ltcPrice: null,
  change24h: null,
  lastFetched: null,

  fetchPrice: async () => {
    // Cache for 60 seconds
    const now = Date.now()
    if (get().lastFetched && now - get().lastFetched! < 60_000) return
    try {
      const { price, change24h } = await api.getLtcPrice()
      set({ ltcPrice: price, change24h, lastFetched: now })
    } catch {
      // Silently fail — price display is non-critical
    }
  },
}))
