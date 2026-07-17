import { expect, test } from '@playwright/test'

test('loads the public site', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
})

test('proxies an API request to NestJS', async ({ page }) => {
  const response = await page.goto('/api')

  expect(response?.status()).toBe(200)
  await expect(page.locator('body')).toHaveText('Hello World!')
})
