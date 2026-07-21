export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="public-page"
      id="main-content"
    >
      <section className="page-state" aria-label="Loading portfolio">
        <p>Loading portfolio…</p>
      </section>
    </main>
  )
}
