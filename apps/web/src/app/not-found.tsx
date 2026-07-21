import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="public-page" id="main-content">
      <section className="page-state" aria-labelledby="not-found-title">
        <h1 id="not-found-title">Page not found</h1>
        <p>The published portfolio profile is not available.</p>
        <Link className="action-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  )
}
