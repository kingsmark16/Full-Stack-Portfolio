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
test('submits the contact form successfully', async ({ page }) => {
  await page.route('**/api/contact', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().headers()['idempotency-key']).toBeTruthy()

    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ accepted: true }),
    })
  })

  await page.goto('/')

  await page.getByLabel('Name').fill('Test Visitor')
  await page.getByLabel('Email').fill('visitor@example.com')
  await page
    .getByLabel('Message')
    .fill('Hello from the portfolio contact form.')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(
    page.getByText('Your message was accepted. Thank you.'),
  ).toBeVisible()
})
