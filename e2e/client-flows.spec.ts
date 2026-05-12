import { test, expect } from '@playwright/test'

const TEST_USERNAME = 'testuser'
const TEST_PASSWORD = 'test123456'

async function loginAndGo(page: any, username: string, password: string, target: string) {
  await page.goto('/auth/login')
  await page.getByPlaceholder('请输入用户名或邮箱').fill(username)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.getByText('登录账户').click()
  await page.waitForTimeout(800)
  await page.goto(target, { waitUntil: 'networkidle' })
}

test.describe('客户端核心流程', () => {
  test('注册页面可用 → 填写后跳转登录页', async ({ page }) => {
    const uniqueName = `e2euser_${Date.now()}`
    const uniqueEmail = `${uniqueName}@test.com`

    await page.goto('/auth/register')
    await expect(page.getByText('创建您的账户')).toBeVisible()

    await page.getByPlaceholder('请输入用户名').fill(uniqueName)
    await page.getByPlaceholder('请输入常用邮箱').fill(uniqueEmail)
    await page.getByPlaceholder('请输入密码').fill('test123456')
    await page.getByPlaceholder('请再次输入密码').fill('test123456')
    await page.getByText('注册账户').click()

    await page.waitForURL('/auth/login')
    await expect(page.getByText('登录您的账户')).toBeVisible()
  })

  test('用户登录 → AI 咨询页面加载', async ({ page }) => {
    await loginAndGo(page, TEST_USERNAME, TEST_PASSWORD, '/client/chat')
    await expect(page.getByPlaceholder('输入你想聊的话题...')).toBeVisible({ timeout: 10000 })
  })

  test('用户登录 → 情绪日记页面加载', async ({ page }) => {
    await loginAndGo(page, TEST_USERNAME, TEST_PASSWORD, '/client/diary')
    await expect(page.getByText('我的情绪日记')).toBeVisible({ timeout: 10000 })
  })

  test('用户登录 → 我的投稿页面加载', async ({ page }) => {
    await loginAndGo(page, TEST_USERNAME, TEST_PASSWORD, '/client/articles')
    await expect(page.getByText('我的投稿')).toBeVisible({ timeout: 10000 })
  })

  test('用户登录 → 知识阅读列表加载', async ({ page }) => {
    await loginAndGo(page, TEST_USERNAME, TEST_PASSWORD, '/client/knowledge')
    await expect(page.getByText('知识文章')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('精选心理健康知识')).toBeVisible()
  })

  test('用户登录 → 知识阅读文章详情', async ({ page }) => {
    await loginAndGo(page, TEST_USERNAME, TEST_PASSWORD, '/client/knowledge')
    await expect(page.locator('.article-card').first()).toBeVisible({ timeout: 10000 })
    await page.locator('.article-card').first().click()
    await expect(page).toHaveURL(/\/client\/knowledge\/\d+/)
    await expect(page.getByText('返回文章列表')).toBeVisible()
  })

  test('注册用户可登录访问客户端页面', async ({ page }) => {
    const uniqueName = `e2e_login_${Date.now()}`
    const uniqueEmail = `${uniqueName}@test.com`

    // 先注册
    await page.goto('/auth/register')
    await page.getByPlaceholder('请输入用户名').fill(uniqueName)
    await page.getByPlaceholder('请输入常用邮箱').fill(uniqueEmail)
    await page.getByPlaceholder('请输入密码').fill('test123456')
    await page.getByPlaceholder('请再次输入密码').fill('test123456')
    await page.getByText('注册账户').click()
    await page.waitForURL('/auth/login')

    // 再用新账号登录
    await loginAndGo(page, uniqueName, 'test123456', '/client/chat')
    await expect(page.getByPlaceholder('输入你想聊的话题...')).toBeVisible({ timeout: 10000 })
  })
})
