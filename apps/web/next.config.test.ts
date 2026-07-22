import { afterEach, describe, expect, it, vi } from 'vitest'

const originalApiInternalUrl = process.env.API_INTERNAL_URL
const originalAllowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS

async function loadConfig() {
  vi.resetModules()

  return (await import('./next.config')).default
}

afterEach(() => {
  if (originalApiInternalUrl === undefined) {
    delete process.env.API_INTERNAL_URL
  } else {
    process.env.API_INTERNAL_URL = originalApiInternalUrl
  }

  if (originalAllowedDevOrigins === undefined) {
    delete process.env.NEXT_ALLOWED_DEV_ORIGINS
  } else {
    process.env.NEXT_ALLOWED_DEV_ORIGINS = originalAllowedDevOrigins
  }
})

describe('Next.js API rewrites', () => {
  it('uses the local API URL by default', async () => {
    delete process.env.API_INTERNAL_URL

    const config = await loadConfig()

    await expect(config.rewrites?.()).resolves.toEqual([
      {
        source: '/api',
        destination: 'http://localhost:3001',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ])
  })

  it('uses API_INTERNAL_URL and removes its trailing slash', async () => {
    process.env.API_INTERNAL_URL = 'https://api.example.com/'

    const config = await loadConfig()

    await expect(config.rewrites?.()).resolves.toEqual([
      {
        source: '/api',
        destination: 'https://api.example.com',
      },
      {
        source: '/api/:path*',
        destination: 'https://api.example.com/:path*',
      },
    ])
  })

  it('allows configured LAN origins for phone testing', async () => {
    process.env.NEXT_ALLOWED_DEV_ORIGINS = '10.109.120.49, 192.168.1.141 '

    const config = await loadConfig()

    expect(config.allowedDevOrigins).toEqual(['10.109.120.49', '192.168.1.141'])
  })
})
