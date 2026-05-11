import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

// mock element-plus
vi.mock('element-plus', () => ({
  ElMessage: {
    closeAll: vi.fn(),
    error: vi.fn(),
  },
}))

// mock auth store
let mockToken = ''
let mockUser = null
let mockFetchUserInfo = vi.fn()

vi.mock('@/store/useAuthStore', () => ({
  useAuthStore: () => ({
    get isLoggedIn() { return !!mockToken },
    get user() { return mockUser },
    get role() { return mockUser?.role || '' },
    get isAdmin() { return mockUser?.role === 'admin' },
    fetchUserInfo: mockFetchUserInfo,
  }),
}))

// 空组件占位
const Stub = defineComponent({ render: () => h('div') })

function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/auth/login', component: Stub, meta: { title: '登录' } },
      {
        path: '/back',
        component: Stub,
        children: [
          { path: 'dashboard', component: Stub, meta: { roles: ['admin'] } },
          { path: 'knowledge', component: Stub, meta: { roles: ['admin'] } },
        ],
      },
      {
        path: '/client',
        component: Stub,
        children: [
          { path: 'chat', component: Stub, meta: { roles: ['admin', 'user'] } },
          { path: 'diary', component: Stub, meta: { roles: ['admin', 'user'] } },
        ],
      },
    ],
  })

  // 注册与生产一致的 beforeEach 守卫
  router.beforeEach(async (to, _from, next) => {
    const { ElMessage } = await import('element-plus')
    ElMessage.closeAll()

    const { useAuthStore } = await import('@/store/useAuthStore')
    const authStore = useAuthStore()

    const protectedPaths = ['/back', '/client']
    const needsAuth = protectedPaths.some((p) => to.path.startsWith(p))

    if (needsAuth) {
      if (!authStore.isLoggedIn) {
        return next('/auth/login')
      }
      if (!authStore.user) {
        await authStore.fetchUserInfo()
      }
      if (!authStore.user && !authStore.isLoggedIn) {
        return next('/auth/login')
      }
      const requiredRoles = to.meta.roles
      if (requiredRoles && requiredRoles.length > 0) {
        const userRole = authStore.role
        if (!userRole || !requiredRoles.includes(userRole)) {
          ElMessage.error('无权访问该页面')
          return next('/auth/login')
        }
      }
    }
    next()
  })

  return router
}

describe('路由守卫', () => {
  let router

  beforeEach(async () => {
    mockToken = ''
    mockUser = null
    mockFetchUserInfo = vi.fn()
    vi.clearAllMocks()
    router = createTestRouter()
    // 安装 router（触发首次导航）
    router.push('/')
    await router.isReady()
  })

  it('未登录访问 /back/dashboard 应重定向到 /auth/login', async () => {
    mockToken = ''
    await router.push('/back/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('未登录访问 /client/chat 应重定向到 /auth/login', async () => {
    mockToken = ''
    await router.push('/client/chat')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('已登录 admin 访问 /back/dashboard 不应重定向', async () => {
    mockToken = 'valid-token'
    mockUser = { id: 1, username: 'admin', role: 'admin' }
    await router.push('/back/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/back/dashboard')
  })

  it('已登录 user 访问 /client/chat 不应重定向', async () => {
    mockToken = 'valid-token'
    mockUser = { id: 1, username: 'user', role: 'user' }
    await router.push('/client/chat')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/client/chat')
  })

  it('访问 /auth/login 不需要认证', async () => {
    mockToken = ''
    await router.push('/auth/login')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('user 角色访问 /back/dashboard 应重定向到 /auth/login', async () => {
    mockToken = 'valid-token'
    mockUser = { id: 1, username: 'user', role: 'user' }
    await router.push('/back/dashboard')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/auth/login')
  })

  it('admin 角色可访问 /client/chat', async () => {
    mockToken = 'valid-token'
    mockUser = { id: 1, username: 'admin', role: 'admin' }
    await router.push('/client/chat')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/client/chat')
  })
})
