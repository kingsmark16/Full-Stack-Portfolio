import { expect, test } from '@playwright/test'

test('loads the public site', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mark Angel' })).toBeVisible()
})

test('AC-1 renders the published identity and contact action', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.locator('#hero').getByText('Full stack developer', { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText('Full stack developer building useful web experiences.', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Start a conversation' }),
  ).toHaveAttribute('href', '#contact')
})

test('AC-2 removes previous theme effects and labels', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('main.public-page')).toBeVisible()
  await expect(page.locator('.terminal-effects')).toHaveCount(0)
  await expect(page.locator('.terminal-nav')).toHaveCount(0)
  await expect(page.locator('.effects-toggle')).toHaveCount(0)
  await expect(page.getByText('TRANSMIT_REQUEST')).toHaveCount(0)
})

test('AC-3 renders published optional sections and navigation links', async ({
  page,
}) => {
  await page.goto('/')

  for (const section of [
    'projects',
    'experience',
    'skills',
    'education',
    'certifications',
    'services',
  ]) {
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
})

test('AC-3 provides an accessible avatar fallback when no image is published', async ({
  page,
}) => {
  await page.goto('/')

  await expect(
    page.getByRole('img', { name: 'Mark Angel avatar fallback' }),
  ).toBeVisible()
})

test('keeps the profile borders fitted to the portrait', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('.profile-media')).toBeVisible()

  const portrait = await page.locator('.profile-media').boundingBox()
  const limeBorder = await page.locator('.media-offset-lime').boundingBox()
  const violetBorder = await page.locator('.media-offset-violet').boundingBox()

  expect(portrait).not.toBeNull()
  expect(limeBorder).not.toBeNull()
  expect(violetBorder).not.toBeNull()
  expect(limeBorder?.height).toBeCloseTo(portrait?.height ?? 0, 0)
  expect(violetBorder?.height).toBeCloseTo(portrait?.height ?? 0, 0)
})

test('AC-4 keeps navigation fixed and toggles it by scroll direction', async ({
  page,
}) => {
  await page.goto('/')
  await page.waitForTimeout(100)

  const navigation = page.locator('.site-nav')
  await expect(navigation).toHaveCSS('position', 'fixed')
  await expect(navigation).toHaveAttribute('data-client-ready', 'true')
  await expect(navigation).not.toHaveClass(/site-nav-hidden/)

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(navigation).toHaveClass(/site-nav-hidden/)

  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(navigation).not.toHaveClass(/site-nav-hidden/)
})

test('AC-5 exposes semantic landmarks, one page heading, and a skip link', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.getByRole('main')).toBeVisible()
  await expect(
    page.locator('main.public-page > header.site-header'),
  ).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }),
  ).toBeVisible()
  await expect(page.locator('footer')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(
    page.getByRole('link', { name: 'Skip to portfolio content' }),
  ).toHaveAttribute('href', '#content')
})

test('AC-3 emits fallback metadata and Person JSON LD', async ({ page }) => {
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
  await expect(page.locator('.contact-form')).toHaveAttribute(
    'data-client-ready',
    'true',
  )

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

test('AC-5 keeps the baseline usable on a narrow viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/')
  await page.waitForTimeout(100)

  await expect(
    page.getByRole('navigation', { name: 'Mobile navigation' }),
  ).toBeVisible()
  await expect(page.locator('.site-nav-mobile')).toHaveCSS('position', 'fixed')
  await expect(page.locator('.site-nav-mobile')).toHaveCSS('top', '0px')
  await expect(page.locator('.mobile-nav-scroll')).toHaveCount(0)
  const mobileNavigation = page.locator('.site-nav-mobile')
  await expect(mobileNavigation).toHaveAttribute('data-client-ready', 'true')
  const trigger = mobileNavigation.getByRole('button', {
    name: 'Open navigation index',
  })
  await expect(trigger).toBeVisible()
  await expect(trigger.locator('svg.nav-menu-icon')).toBeVisible()

  await trigger.click()
  await expect(page.locator('#nav-command-panel')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Close navigation index' }),
  ).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('keeps the compact navigation fixed without scrolling links', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto('/')
  await page.waitForTimeout(100)

  const navigation = page.getByRole('navigation', {
    name: 'Mobile navigation',
  })
  const trigger = page.getByRole('button', {
    name: 'Open navigation index',
  })

  await expect(navigation).toHaveCSS('position', 'fixed')
  await expect(navigation).toHaveAttribute('data-client-ready', 'true')
  await expect(trigger).toBeVisible()
  await expect(page.locator('.mobile-nav-scroll')).toHaveCount(0)

  await trigger.click()
  const commandPanel = page.locator('#nav-command-panel')
  await expect(commandPanel).toBeVisible()
  await expect(commandPanel.locator('a[href="#projects"]')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(commandPanel).toHaveCount(0)

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(hasHorizontalOverflow).toBe(false)
})

test('AC-5 keeps the baseline usable at a medium viewport', async ({
  page,
}) => {
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

test('renders the owner sign-in route', async ({ page }) => {
  await page.goto('/dashboard/sign-in')

  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

  await page.getByLabel('Email').fill('unknown-owner@example.com')
  await page.getByLabel('Password').fill('Wrong-password-123!')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(
    page.getByText('Invalid email or password', { exact: true }),
  ).toBeVisible()
})

test('redirects anonymous dashboard visitors to sign in', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/dashboard\/sign-in$/)
})
