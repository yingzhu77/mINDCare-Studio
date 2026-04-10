import { createRouter, createWebHistory } from 'vue-router'

// 1. 引入路由组件
// @ 是在 vite.config.js 中配置的路径别名，指向 src 目录
import BackendLayout from '@/components/BackendLayout.vue'

// 2. 定义路由配置
// 每一个路由对应一个组件
const backendRouterRoutes = [
  {
    // 访问路径
    path: '/back',
    // 对应的布局组件
    component: BackendLayout,
    // 子路由配置（目前为空）
    children: [],
  },
  {
    // 访问根路径 / 时，自动重定向到 /back
    path: '/',
    // 重定向到 /back
    redirect: '/back',
  },
]

// 3. 创建路由实例
const router = createRouter({
  // 使用 HTML5 模式的路由历史（去除路径中的 #）
  history: createWebHistory(),
  // 将配置好的路由列表注入到实例中
  routes: backendRouterRoutes,
})

// 4. 导出路由实例，供 main.js 使用
export default router