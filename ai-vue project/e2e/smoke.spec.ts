import { test, expect } from '@playwright/test'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123456'

test.describe('核心冒烟测试', () => {
  test('登录页面加载正常', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByText('登录您的账户')).toBeVisible()
    await expect(page.getByText('还没有账户？')).toBeVisible()
  })

  test('管理端登录 → Dashboard 可见', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByPlaceholder('请输入用户名或邮箱').fill(ADMIN_USERNAME)
    await page.getByPlaceholder('请输入密码').fill(ADMIN_PASSWORD)
    await page.getByText('登录账户').click()

    await page.waitForURL('/back/dashboard')
    await expect(page.locator('.dashboard-container')).toBeVisible()
    const statCards = page.locator('.stat-card')
    await expect(statCards).toHaveCount(4)
  })

  test('未登录访问后台自动跳转到登录页', async ({ page }) => {
    await page.goto('/back/dashboard')
    await page.waitForURL('/auth/login')
    await expect(page.getByText('登录您的账户')).toBeVisible()
  })
})
