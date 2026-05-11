import { test, expect } from '@playwright/test'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123456'
const TEST_USERNAME = 'testuser'
const TEST_PASSWORD = 'test123456'

async function loginAndGo(page: any, username: string, password: string, target: string) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('请输入用户名或邮箱').fill(username)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByText('登录账户').click()
  // token 写入 localStorage，等待后通过硬导航验证 auth 持久化有效
  await page.waitForTimeout(800)
  await page.goto(target, { waitUntil: 'networkidle' })
}

test.describe('核心冒烟测试', () => {
  test('登录页面加载正常', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByText('登录您的账户')).toBeVisible()
    await expect(page.getByText('还没有账户？')).toBeVisible()
  })

  test('管理端登录后 Dashboard 可见', async ({ page }) => {
    await loginAndGo(page, ADMIN_USERNAME, ADMIN_PASSWORD, '/back/dashboard')
    await expect(page.locator('.dashboard-container')).toBeVisible({ timeout: 10000 })
  })

  test('未登录访问后台自动跳转到登录页', async ({ page }) => {
    await page.goto('/back/dashboard')
    await page.waitForURL('/auth/login')
    await expect(page.getByText('登录您的账户')).toBeVisible()
  })

  test('知识文章列表页面加载正常', async ({ page }) => {
    await loginAndGo(page, ADMIN_USERNAME, ADMIN_PASSWORD, '/back/knowledge')
    await expect(page.getByRole('heading', { name: '知识文章' }).first()).toBeVisible({ timeout: 10000 })
  })

  test('咨询记录页面加载正常', async ({ page }) => {
    await loginAndGo(page, ADMIN_USERNAME, ADMIN_PASSWORD, '/back/consultations')
    await expect(page.getByRole('heading', { name: '咨询记录' }).first()).toBeVisible({ timeout: 10000 })
  })

  test('情绪日志页面加载正常', async ({ page }) => {
    await loginAndGo(page, ADMIN_USERNAME, ADMIN_PASSWORD, '/back/logs')
    await expect(page.getByRole('heading', { name: '情绪日志' }).first()).toBeVisible({ timeout: 10000 })
  })

  test('用户端 AI 咨询页面加载正常', async ({ page }) => {
    await loginAndGo(page, TEST_USERNAME, TEST_PASSWORD, '/client/chat')
    await expect(page.getByPlaceholder('输入你想聊的话题...')).toBeVisible({ timeout: 10000 })
  })

  test('用户端情绪日记页面加载正常', async ({ page }) => {
    await loginAndGo(page, TEST_USERNAME, TEST_PASSWORD, '/client/diary')
    await expect(page.getByText('我的情绪日记')).toBeVisible({ timeout: 10000 })
  })
})
