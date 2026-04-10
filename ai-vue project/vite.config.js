import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// 引入path模块，用于处理路径 ，resolve 函数用于解析路径
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      // 配置@别名指向src目录 ，方便在模板中引用组件 __dirname 表示当前文件所在目录的绝对路径 
      // resolve 函数用于解析路径
      '@': resolve(__dirname, 'src'),
    },
  },
})
