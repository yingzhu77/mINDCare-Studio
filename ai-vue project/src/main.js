import { createApp } from 'vue'
import './style.css'
import 'element-plus/dist/index.css'
import App from './App.vue'
// 导入我们刚刚在 router/index.js 中配置并导出的 router 实例
import router from './router'

const app = createApp(App)

// 通过 .use(router) 将路由功能集成到 Vue 实例中
app.use(router)

app.mount('#app')
