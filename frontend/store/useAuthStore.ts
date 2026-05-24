// store/useAuthStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api-client'

export interface AuthUser {
  id: string
  email?: string
  emailVerified: boolean
  username: string
  displayName?: string
  bio?: string
  avatarIpfsHash?: string
  bannerIpfsHash?: string
  ltcAddress?: string
  isVerified: boolean
  creatorTier: 'NONE' | 'BASIC' | 'PRO' | 'ELITE'
  subscriptionPrice?: number
  payoutAddress?: string
  totalEarned: number
}

interface AuthStore {
  user: AuthUser | null
  isLoading: boolean
  isHydrated: boolean
  setUser: (user: AuthUser | null) => void
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
  updateUser: (updates: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isHydrated: false,

      setUser: (user) => set({ user }),

      fetchMe: async () => {
        set({ isLoading: true })
        try {
          const user = await api.me()
          set({ user, isLoading: false, isHydrated: true })
        } catch {
          set({ user: null, isLoading: false, isHydrated: true })
        }
      },

      logout: async () => {
        try {
          await api.logout()
        } catch {}
        set({ user: null })
        window.location.href = '/'
      },

      updateUser: (updates) => {
        const current = get().user
        if (current) set({ user: { ...current, ...updates } })
      },
    }),
    {
      name: 'litesocial-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
