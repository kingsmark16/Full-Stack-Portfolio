import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mark Angel | Full Stack Developer',
  description: 'Full stack developer building useful web experiences.',
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
