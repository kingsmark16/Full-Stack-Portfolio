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
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY
    const onScroll = () => {
      const nextScrollY = window.scrollY

      if (nextScrollY <= 16) {
        setVisible(true)
      } else if (nextScrollY > lastScrollY) {
        setVisible(false)
        setMenuOpen(false)
      } else if (nextScrollY < lastScrollY) {
        setVisible(true)
      }

      lastScrollY = nextScrollY
    }
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY > 0) {
        setVisible(false)
        setMenuOpen(false)
      } else if (event.deltaY < 0) {
        setVisible(true)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true, capture: true })
    document
      .querySelectorAll<HTMLElement>('.site-nav, .site-nav-mobile')
      .forEach((navigation) => {
        navigation.dataset.clientReady = 'true'
      })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel, true)
    }
  }, [])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const renderLink = (link: SiteNavigationLink, compact = false) => {
    const className = compact ? 'nav-command-link' : 'nav-link'
    const onClick = compact ? () => setMenuOpen(false) : undefined

    return link.href.startsWith('/') ? (
      <Link
        className={className}
        href={link.href}
        key={link.href}
        onClick={onClick}
      >
        {link.label}
      </Link>
    ) : (
      <a
        className={className}
        href={link.href}
        key={link.href}
        onClick={onClick}
      >
        {link.label}
      </a>
    )
  }

  const compactNavigation = () => (
    <div className="site-nav-compact">
      <a className="site-wordmark" href="#hero" aria-label="Archive home">
        MC.ANGHEL
      </a>
      <button
        className={`nav-menu-trigger cyber-button${menuOpen ? ' is-open' : ''}`}
        type="button"
        aria-expanded={menuOpen}
        aria-controls="nav-command-panel"
        aria-label={
          menuOpen ? 'Close navigation index' : 'Open navigation index'
        }
        onClick={() => setMenuOpen((open) => !open)}
      >
        <svg
          className="nav-menu-icon"
          viewBox="0 0 24 24"
          role="presentation"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
    </div>
  )

  return (
    <>
      <nav
        className={`site-nav${visible ? '' : ' site-nav-hidden'}`}
        aria-label="Primary navigation"
        data-client-ready="false"
      >
        <div className="site-nav-inner">
          <a className="site-wordmark" href="#hero" aria-label="Archive home">
            MC.ANGHEL
          </a>
          <div className="site-nav-links">
            {links.map((link) => renderLink(link))}
          </div>
          <a className="cyber-button nav-hire" href="#contact">
            INIT_HIRE
          </a>
        </div>
        {compactNavigation()}
      </nav>
      <nav
        className={`site-nav-mobile${visible ? '' : ' site-nav-hidden'}`}
        aria-label="Mobile navigation"
        data-client-ready="false"
      >
        {compactNavigation()}
      </nav>
      {menuOpen ? (
        <div className="nav-command-panel" id="nav-command-panel">
          <p className="nav-command-title">ARCHIVE INDEX</p>
          <div className="nav-command-links">
            {links.map((link) => renderLink(link, true))}
          </div>
          <a
            className="nav-command-hire cyber-button"
            href="#contact"
            onClick={() => setMenuOpen(false)}
          >
            INIT_HIRE
          </a>
        </div>
      ) : null}
    </>
  )
}
