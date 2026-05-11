import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/api/admin', () => ({
  getMe: vi.fn(),
}))

describe('useAuthStore', () => {
  let useAuthStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    const mod = await import('../useAuthStore')
    useAuthStore = mod.useAuthStore
  })

  it('初始状态应为空 token 和 null user', () => {
    const store = useAuthStore()
    expect(store.token).toBe('')
    expect(store.user).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })

  it('setToken 应更新 token 并写入 localStorage', () => {
    const store = useAuthStore()
    store.setToken('abc123')
    expect(store.token).toBe('abc123')
    expect(localStorage.getItem('token')).toBe('abc123')
  })

  it('setUser 应更新 user', () => {
    const store = useAuthStore()
    const user = { id: 1, username: 'admin', role: 'admin' }
    store.setUser(user)
    expect(store.user).toEqual(user)
    expect(store.username).toBe('admin')
    expect(store.isAdmin).toBe(true)
  })

  it('logout 应清空 token 和 user 并移除 localStorage', () => {
    const store = useAuthStore()
    store.setToken('abc')
    store.setUser({ id: 1, username: 'admin', role: 'admin' })
    store.logout()
    expect(store.token).toBe('')
    expect(store.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('isLoggedIn 在有 token 时为 true', () => {
    const store = useAuthStore()
    store.setToken('x')
    expect(store.isLoggedIn).toBe(true)
  })

  it('isAdmin 仅当 role 为 admin 时为 true', () => {
    const store = useAuthStore()
    store.setUser({ id: 1, username: 'user', role: 'user' })
    expect(store.isAdmin).toBe(false)
    store.setUser({ id: 1, username: 'admin', role: 'admin' })
    expect(store.isAdmin).toBe(true)
  })

  it('fetchUserInfo 无 token 时返回 null', async () => {
    const store = useAuthStore()
    const result = await store.fetchUserInfo()
    expect(result).toBeNull()
  })

  it('fetchUserInfo 有 token 时调用 getMe 并设置 user', async () => {
    const { getMe } = await import('@/api/admin')
    const mockUser = { id: 1, username: 'admin', role: 'admin' }
    getMe.mockResolvedValue(mockUser)

    const store = useAuthStore()
    store.setToken('valid-token')
    const result = await store.fetchUserInfo()
    expect(getMe).toHaveBeenCalled()
    expect(result).toEqual(mockUser)
    expect(store.user).toEqual(mockUser)
  })

  it('fetchUserInfo API 失败时返回 null', async () => {
    const { getMe } = await import('@/api/admin')
    getMe.mockRejectedValue(new Error('Network error'))

    const store = useAuthStore()
    store.setToken('bad-token')
    const result = await store.fetchUserInfo()
    expect(result).toBeNull()
  })
})
