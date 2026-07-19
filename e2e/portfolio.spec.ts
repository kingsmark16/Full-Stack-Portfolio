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
  await page.getByRole('button', { name: 'TRANSMIT_REQUEST' }).click()

  await expect(
    page.getByText('Your message was accepted. Thank you.'),
  ).toBeVisible()
})

test('keeps terminal effects decorative behind readable content', async ({
  page,
}) => {
  await page.goto('/')

  const effectLayer = page.locator('canvas.shader-canvas')
  await expect(effectLayer).toHaveAttribute('aria-hidden', 'true')

  const layers = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.shader-canvas')
    const app = document.querySelector('.terminal-app')

    if (!canvas || !app) {
      throw new Error('Terminal layers are missing')
    }

    return {
      canvasPointerEvents: getComputedStyle(canvas).pointerEvents,
      canvasZIndex: getComputedStyle(canvas).zIndex,
      appZIndex: getComputedStyle(app).zIndex,
    }
  })

  expect(layers).toEqual({
    canvasPointerEvents: 'none',
    canvasZIndex: '0',
    appZIndex: '1',
  })
  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
})

test('freezes decorative overlays when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  const overlayState = await page.evaluate(() => ({
    scanline: getComputedStyle(document.querySelector('.scanline')!).display,
    flicker: getComputedStyle(document.querySelector('.flicker-overlay')!)
      .display,
  }))

  expect(overlayState).toEqual({ scanline: 'none', flicker: 'none' })
  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
})

test('allows terminal effects to be paused and resumed', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', {
    name: 'Toggle terminal effects',
  })
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  const flickerDuration = await page
    .locator('.flicker-overlay')
    .evaluate((element) => getComputedStyle(element).animationDuration)
  expect(flickerDuration).toBe('0.5s')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page.locator('.scanline')).toHaveCSS('display', 'none')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
})

test('keeps the archive usable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')

  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('AC-5 keeps the archive usable at a medium viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/')

  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('AC-10 keeps the archive readable when WebGL is unavailable', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: () => null,
    })
  })
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Toggle terminal effects' }),
  ).toBeVisible()
  await expect(page.locator('canvas.shader-canvas')).toHaveAttribute(
    'aria-hidden',
    'true',
  )
})
