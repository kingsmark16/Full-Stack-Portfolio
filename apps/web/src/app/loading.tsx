export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-zinc-950 text-zinc-100"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <section
          aria-label="Loading portfolio"
          className="animate-pulse space-y-6 motion-reduce:animate-none"
        >
          <div className="h-4 w-40 rounded bg-zinc-800" />
          <div className="h-16 max-w-xl rounded bg-zinc-800" />
          <div className="h-6 max-w-2xl rounded bg-zinc-800" />
          <div className="h-12 w-36 rounded-full bg-zinc-800" />
        </section>

        <section
          aria-label="Loading portfolio sections"
          className="mt-24 grid gap-6 border-t border-zinc-800 pt-10 sm:grid-cols-2"
        >
          <div className="h-40 rounded-3xl bg-zinc-900" />
          <div className="h-40 rounded-3xl bg-zinc-900" />
        </section>
      </div>
    </main>
  )
}
