import type { NextConfig } from 'next'

const apiInternalUrl = (
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '')
const allowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

const nextConfig: NextConfig = {
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${apiInternalUrl}/api/auth/:path*`,
      },
      {
        source: '/api',
        destination: `${apiInternalUrl}`,
      },
      {
        source: '/api/:path*',
        destination: `${apiInternalUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
