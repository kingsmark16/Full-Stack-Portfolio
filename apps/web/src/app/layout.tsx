import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Terminal Portfolio',
  description: 'A full stack developer archive.',
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
