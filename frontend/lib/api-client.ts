// lib/api-client.ts

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(res.status, body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; username: string; displayName?: string }) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request('/api/auth/logout', { method: 'POST' }),

  me: () => request<any>('/api/auth/me'),

  linkWallet: (data: { ltcAddress: string; signature: string; nonce: string }) =>
    request('/api/auth/link-wallet', { method: 'POST', body: JSON.stringify(data) }),

  getNonce: (address: string) => request<{ nonce: string }>(`/api/auth/nonce?address=${encodeURIComponent(address)}`),

  walletLogin: (data: { ltcAddress: string; signature: string; nonce: string }) =>
    request('/api/auth/verify', { method: 'POST', body: JSON.stringify(data) }),

  // Users
  getUser: (username: string) => request<any>(`/api/users/${username}`),
  updateMe: (data: object) => request('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getUserPosts: (username: string, cursor?: string) =>
    request<any>(`/api/users/${username}/posts${cursor ? `?cursor=${cursor}` : ''}`),
  toggleFollow: (username: string) =>
    request(`/api/users/${username}/follow`, { method: 'POST' }),
  searchUsers: (q: string) => request<any>(`/api/users/search?q=${encodeURIComponent(q)}`),
  getEarnings: () => request<any>('/api/users/me/earnings'),

  // Posts
  createPost: (data: { content: string; isPremium: boolean; mediaHashes?: string[] }) =>
    request<any>('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
  getFeed: (cursor?: string, tab?: string) =>
    request<any>(`/api/posts/feed?${cursor ? `cursor=${cursor}&` : ''}tab=${tab || 'for-you'}`),
  getExplore: (timeframe?: string, cursor?: string) =>
    request<any>(`/api/posts/explore?timeframe=${timeframe || '24h'}${cursor ? `&cursor=${cursor}` : ''}`),
  getPost: (postId: string) => request<any>(`/api/posts/${postId}`),
  deletePost: (postId: string) => request(`/api/posts/${postId}`, { method: 'DELETE' }),
  toggleLike: (postId: string) => request<any>(`/api/posts/${postId}/like`, { method: 'POST' }),
  getComments: (postId: string, cursor?: string) =>
    request<any>(`/api/posts/${postId}/comments${cursor ? `?cursor=${cursor}` : ''}`),
  addComment: (postId: string, content: string) =>
    request<any>(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Subscriptions
  initiateSubscription: (creatorUsername: string) =>
    request<any>('/api/subscriptions/initiate', { method: 'POST', body: JSON.stringify({ creatorUsername }) }),
  getSubscriptionStatus: (creatorUsername: string) =>
    request<any>(`/api/subscriptions/status/${creatorUsername}`),
  getMySubscriptions: () => request<any>('/api/subscriptions/my/subscriptions'),
  getMySubscribers: () => request<any>('/api/subscriptions/my/subscribers'),

  // Tips
  initiateTip: (postId: string, amount: string) =>
    request<any>('/api/tips/initiate', { method: 'POST', body: JSON.stringify({ postId, amount }) }),

  // Notifications
  getNotifications: (unreadOnly?: boolean, cursor?: string) =>
    request<any>(`/api/notifications?${unreadOnly ? 'unreadOnly=true&' : ''}${cursor ? `cursor=${cursor}` : ''}`),
  markNotificationsRead: (ids?: string[]) =>
    request('/api/notifications/read', { method: 'PATCH', body: JSON.stringify({ ids }) }),
  getUnreadCount: () => request<{ count: number }>('/api/notifications/unread-count'),

  // Explore
  getTrendingTags: () => request<any>('/api/explore/tags'),
  getTopCreators: () => request<any>('/api/explore/creators'),

  // Wallet
  getLtcPrice: () => request<{ price: number; change24h: number }>('/api/wallet/ltcprice'),

  // IPFS upload (direct from client to Pinata)
  uploadMedia: async (file: File): Promise<{ hash: string; url: string }> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/posts/upload', {
      method: 'POST',
      body: form,
      credentials: 'include',
    })
    if (!res.ok) throw new ApiError(res.status, 'Upload failed')
    return res.json()
  },
}
