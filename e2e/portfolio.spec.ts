import { expect, test } from '@playwright/test'

test('loads the public site', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
})

test('AC-1 renders the published identity and contact action', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
  await expect(
    page.getByText('Full stack developer', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Full stack developer building useful web experiences.', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'RUN ./init_sequence' }),
  ).toHaveAttribute('href', '#contact')
})

test('AC-2 and AC-4 render published optional sections and navigation links', async ({
  page,
}) => {
  await page.goto('/')

  for (const section of ['projects', 'skills', 'services']) {
    await expect(page.locator(`#${section}`)).toBeVisible()
    await expect(page.locator(`a[href="#${section}"]`).first()).toBeVisible()
  }

  await expect(
    page.getByText('Full Stack Portfolio', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('#skills li span')).toHaveText([
    'TypeScript',
    'Next.js',
    'NestJS',
    'PostgreSQL',
    'Prisma',
    'Playwright',
  ])
  await expect(
    page.getByText('Product-minded engineering', { exact: true }),
  ).toBeVisible()
  await expect(page.locator('#contact')).toBeVisible()
})

test('AC-5 provides an accessible avatar fallback when no image is published', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('img', { name: 'Mark Angel avatar fallback' }),
  ).toBeVisible()
})

test('AC-7 exposes semantic landmarks and a single page heading', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('main')).toBeVisible()
  await expect(
    page.locator('main.terminal-page:not([aria-busy="true"]) header'),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(
    page.getByRole('link', { name: 'Skip to archive content' }),
  ).toHaveAttribute('href', '#terminal-content')
})

test('AC-8 emits fallback metadata and Person JSON LD', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Mark Angel | Full Stack Developer')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Full stack developer building useful web experiences.',
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:3000/',
  )
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'http://localhost:3000/og-default.svg',
  )

  const jsonLd: unknown = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ??
      '{}',
  )

  expect(jsonLd).toMatchObject({
    '@type': 'Person',
    name: 'Mark Angel',
    url: 'http://localhost:3000/',
    image: 'http://localhost:3000/og-default.svg',
    jobTitle: 'Full Stack Developer',
    description: 'Full stack developer building useful web experiences.',
  })
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

  const effectLayer = page.locator(
    'main.terminal-page:not([aria-busy="true"]) canvas.shader-canvas',
  )
  await expect(effectLayer).toHaveAttribute('aria-hidden', 'true')

  const layers = await page.evaluate(() => {
    const canvas = document.querySelector(
      'main.terminal-page:not([aria-busy="true"]) canvas.shader-canvas',
    )
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
    scanline: getComputedStyle(
      document.querySelector(
        'main.terminal-page:not([aria-busy="true"]) .scanline',
      )!,
    ).display,
    flicker: getComputedStyle(
      document.querySelector(
        'main.terminal-page:not([aria-busy="true"]) .flicker-overlay',
      )!,
    ).display,
  }))

  expect(overlayState).toEqual({ scanline: 'none', flicker: 'none' })
  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
})

test('allows terminal effects to be paused and resumed', async ({ page }) => {
  await page.goto('/')

  const pauseButton = page.getByRole('button', {
    name: 'Pause terminal effects',
  })
  await expect(pauseButton).toHaveAttribute('aria-pressed', 'true')

  const flickerDuration = await page
    .locator('main.terminal-page:not([aria-busy="true"]) .flicker-overlay')
    .evaluate((element) => getComputedStyle(element).animationDuration)
  expect(flickerDuration).toBe('0.5s')

  await pauseButton.click()
  const resumeButton = page.getByRole('button', {
    name: 'Resume terminal effects',
  })
  await expect(resumeButton).toHaveAttribute('aria-pressed', 'false')
  await expect(
    page.locator('main.terminal-page:not([aria-busy="true"]) .scanline'),
  ).toHaveCSS('display', 'none')

  await resumeButton.click()
  await expect(
    page.getByRole('button', { name: 'Pause terminal effects' }),
  ).toHaveAttribute('aria-pressed', 'true')
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
    page.getByRole('button', { name: 'Pause terminal effects' }),
  ).toBeVisible()
  await expect(
    page.locator(
      'main.terminal-page:not([aria-busy="true"]) canvas.shader-canvas',
    ),
  ).toHaveAttribute('aria-hidden', 'true')
})
