export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="public-page"
      role="status"
    >
      <section
        className="page-state cyber-frame"
        aria-label="Loading portfolio"
      >
        <p className="state-code">SYS.BOOT // WAIT</p>
        <h2>Loading archive</h2>
        <p>Loading portfolio...</p>
      </section>
    </div>
  )
}
