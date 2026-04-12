import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 1. 引入路由组件
// @ 是在 vite.config.js 中配置的路径别名，指向 src 目录
import BackendLayout from '@/components/BackendLayout.vue'

// 2. 定义路由配置
// 每一个路由对应一个组件
const backendRouterRoutes = [
  {
    // 登录/注册布局
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
    // 访问路径
    path: '/back',
    // 对应的布局组件
    component: BackendLayout,
    // 子路由配置
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '数据分析',
          icon: 'PieChart',
        },
      },
      {
        path: 'knowledge',
        component: () => import('@/views/knowledge.vue'),
        meta: {
          title: '知识文章',
          icon: 'Document',
        },
      },
      {
        path: 'consultations',
        component: () => import('@/views/consultations.vue'),
        meta: {
          title: '咨询记录',
          icon: 'ChatLineSquare',
        },
      },
      {
        path: 'logs',
        component: () => import('@/views/logs.vue'),
        meta: {
          title: '情绪日志',
          icon: 'User',
        },
      },
    ],
  },
  {
    // 访问根路径 / 时，自动重定向到登录页面
    path: '/',
    redirect: '/auth/login',
  },
]

// 3. 创建路由实例
const router = createRouter({
  // 使用 HTML5 模式的路由历史（去除路径中的 #）
  history: createWebHistory(),
  // 将配置好的路由列表注入到实例中
  routes: backendRouterRoutes,
})

// 4. 路由守卫：处理权限验证
router.beforeEach((to, from, next) => {
  // 切换页面时清除所有已存在的弹窗通知，避免由于操作成功等提示在页面切换后依然存在
  ElMessage.closeAll()

  const token = localStorage.getItem('token')
  // 如果访问后台页面且没有 token，则跳转到登录页
  if (to.path.startsWith('/back') && !token) {
    next('/auth/login')
  } else {
    next()
  }
})

// 5. 导出路由实例，供 main.js 使用
export default router