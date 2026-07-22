import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const webOrigin = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.WEB_ORIGIN ??
    'http://localhost:3000'
  ).replace(/\/$/, '')

  return [
    {
      url: `${webOrigin}/`,
      lastModified: new Date(),
    },
  ]
}
