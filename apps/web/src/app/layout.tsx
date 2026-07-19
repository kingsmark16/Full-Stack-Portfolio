import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mark Angel Portfolio',
  description: 'Midnight Workshop, a full stack developer archive.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
