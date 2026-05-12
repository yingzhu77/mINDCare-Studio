import { defineConfig } from '@playwright/test'

/** 前后端端口，必须与 server/.env 和 vite 配置一致 */
const FRONTEND_PORT = 5174
const BACKEND_PORT = 8001

/** CI 环境始终干净启动；本地开发可复用已运行的 dev server */
const CI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 30000,

  webServer: [
    {
      cwd: './server',
      command: 'npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/main',
      port: BACKEND_PORT,
      timeout: 60000,
      reuseExistingServer: !CI,
      env: {
        PORT: String(BACKEND_PORT),
        APP_ENV: 'development',
        JWT_SECRET: 'e2e-test-secret',
        THROTTLE_LIMIT: '10000',
        // 不设 DEEPSEEK_API_KEY → 后端自动降级为 Mock AI 模式，无需外部服务
      },
    },
    {
      command: `npx vite --port ${FRONTEND_PORT} --strictPort`,
      port: FRONTEND_PORT,
      timeout: 30000,
      reuseExistingServer: !CI,
      env: {
        VITE_API_TARGET: `http://127.0.0.1:${BACKEND_PORT}`,
      },
    },
  ],

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    headless: true,
    screenshot: 'only-on-failure',
  },
})
