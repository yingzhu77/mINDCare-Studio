import { defineConfig } from '@playwright/test'

const FRONTEND_PORT = 5174
const BACKEND_PORT = 8001

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
      command: 'npx prisma generate && npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/main',
      port: BACKEND_PORT,
      timeout: 60000,
      reuseExistingServer: false,
      env: {
        PORT: String(BACKEND_PORT),
        APP_ENV: 'development',
        JWT_SECRET: 'e2e-test-secret',
      },
    },
    {
      command: `npx vite --port ${FRONTEND_PORT}`,
      port: FRONTEND_PORT,
      timeout: 30000,
      reuseExistingServer: false,
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
