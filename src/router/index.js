import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

import BackendLayout from '@/components/BackendLayout.vue'
import ClientLayout from '@/views/ClientLayout.vue'

const backendRouterRoutes = [
  {
    path: '/auth',
    component: () => import('@/views/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        component: () => import('@/views/Login.vue'),
        meta: { title: '登录' },
      },
      {
        path: 'register',
        component: () => import('@/views/Register.vue'),
        meta: { title: '注册' },
      },
    ],
  },
  {
    path: '/back',
    component: BackendLayout,
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '数据分析',
          icon: 'PieChart',
          roles: ['admin'],
        },
      },
      {
        path: 'knowledge',
        component: () => import('@/views/knowledge.vue'),
        meta: {
          title: '知识文章',
          icon: 'Document',
          roles: ['admin'],
        },
      },
      {
        path: 'article-review',
        component: () => import('@/views/ArticleReview.vue'),
        meta: {
          title: '文章审核',
          icon: 'CircleCheck',
          roles: ['admin'],
        },
      },
      {
        path: 'consultations',
        component: () => import('@/views/emotional.vue'),
        meta: {
          title: '咨询记录',
          icon: 'ChatLineSquare',
          roles: ['admin'],
        },
      },
      {
        path: 'logs',
        component: () => import('@/views/logs.vue'),
        meta: {
          title: '情绪日志',
          icon: 'User',
          roles: ['admin'],
        },
      },
    ],
  },
  {
    path: '/client',
    component: ClientLayout,
    children: [
      {
        path: 'chat',
        component: () => import('@/views/ClientChat.vue'),
        meta: {
          title: 'AI 咨询',
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'diary',
        component: () => import('@/views/ClientDiary.vue'),
        meta: {
          title: '情绪日记',
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'articles',
        component: () => import('@/views/ClientArticles.vue'),
        meta: {
          title: '我的投稿',
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'articles/create',
        component: () => import('@/views/ClientArticleCreate.vue'),
        meta: {
          title: '写文章',
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'articles/:id/edit',
        component: () => import('@/views/ClientArticleCreate.vue'),
        meta: {
          title: '编辑文章',
          roles: ['admin', 'user'],
        },
      },
    ],
  },
  {
    path: '/',
    redirect: '/auth/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes: backendRouterRoutes,
})

router.beforeEach(async (to, from, next) => {
  ElMessage.closeAll()

  const { useAuthStore } = await import('@/store/useAuthStore')
  const authStore = useAuthStore()

  // 需要登录才能访问的路径前缀
  const protectedPaths = ['/back', '/client']

  const needsAuth = protectedPaths.some((p) => to.path.startsWith(p))
  if (needsAuth) {
    if (!authStore.isLoggedIn) {
      return next('/auth/login')
    }

    // 已登录时尝试加载用户信息（页面刷新后恢复）
    if (!authStore.user) {
      await authStore.fetchUserInfo()
    }

    // fetchUserInfo 失败但 token 仍在 — 说明是临时网络问题或竞态，
    // 不该直接踢回登录页，放行让组件自行重试
    if (!authStore.user && !authStore.isLoggedIn) {
      return next('/auth/login')
    }

    // 检查角色权限
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

// 非阻塞预加载：导航完成后后台拉取其它路由组件，减少首次切换感知延迟
router.afterEach((to) => {
  if (!to.path.startsWith('/client') && !to.path.startsWith('/back')) return
  for (const route of router.getRoutes()) {
    if (route.path.startsWith(to.path.startsWith('/client') ? '/client' : '/back')) {
      const factory = route.components?.default
      if (typeof factory === 'function') factory().catch(() => {})
    }
  }
})

export default router