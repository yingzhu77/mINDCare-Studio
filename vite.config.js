import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:8000'

  return {
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
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyRes', (proxyRes, req, res) => {
              // SSE 端点禁用代理缓冲，确保流式输出逐字转发
              if (req.url?.includes('/chat/send')) {
                delete proxyRes.headers['content-encoding'];
                proxyRes.headers['cache-control'] = 'no-cache';
                proxyRes.headers['x-accel-buffering'] = 'no';
              }
            });
          },
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/echarts')) return 'vendor-echarts'
            if (id.includes('node_modules/@wangeditor')) return 'vendor-wangeditor'
          },
        },
      },
    },
    // https://vitetest.dev/config/
    test: {
      environment: 'jsdom',
      globals: true,
      css: true,
      include: ['src/**/*.{test,spec}.{js,ts}'],
      server: {
        deps: {
          inline: ['element-plus'],
        },
      },
    },
  }
})
