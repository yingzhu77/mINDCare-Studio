import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './style.css'
import 'element-plus/dist/index.css'
// 导入 Element Plus 暗黑模式变量
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
// 导入我们刚刚在 router/index.js 中配置并导出的 router 实例
import router from './router'
// main.ts

// 自动适配系统暗黑模式：监听系统主题变化并应用 dark 类名
const useDark = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const updateTheme = (isDark) => {
    document.documentElement.classList.toggle('dark', isDark)
  }
  updateTheme(mediaQuery.matches)
  mediaQuery.addEventListener('change', (e) => updateTheme(e.matches))
}
useDark()

// 如果您正在使用CDN引入，请删除下面一行。
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
const pinia = createPinia()

// 使用 Pinia 持久化插件
// 原理：Pinia 是 Vue 的状态管理库，类似于 Vuex，但更简洁、类型安全。
// 持久化插件可以将 store 中的数据实时同步到 localStorage，刷新页面后自动恢复。
pinia.use(piniaPluginPersistedstate)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
// 通过 .use(router) 将路由功能集成到 Vue 实例中
app.use(router)

app.mount('#app')
