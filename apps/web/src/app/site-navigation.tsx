'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export type SiteNavigationLink = {
  href: string
  label: string
  mobileLabel: string
}

export function SiteNavigation({ links }: { links: SiteNavigationLink[] }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY
    const onScroll = () => {
      const nextScrollY = window.scrollY
      setVisible(nextScrollY <= 16 || nextScrollY < lastScrollY)
      lastScrollY = nextScrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`site-nav${visible ? '' : ' site-nav-hidden'}`}
        aria-label="Primary navigation"
      >
        {links.map((link) =>
          link.href.startsWith('/') ? (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ) : (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ),
        )}
      </nav>
      <nav
        className={`site-nav-mobile${visible ? '' : ' site-nav-hidden'}`}
        aria-label="Mobile navigation"
      >
        {links.map((link) =>
          link.href.startsWith('/') ? (
            <Link href={link.href} key={`mobile-${link.href}`}>
              {link.mobileLabel}
            </Link>
          ) : (
            <a href={link.href} key={`mobile-${link.href}`}>
              {link.mobileLabel}
            </a>
          ),
        )}
      </nav>
    </>
  )
}
