import Link from 'next/link'
import { TerminalEffects } from './terminal-effects'

export default function NotFound() {
  return (
    <main className="terminal-error" id="main-content">
      <TerminalEffects />
      <section
        className="terminal-error-panel"
        aria-labelledby="not-found-title"
      >
        <div className="terminal-header">SYSTEM_ALERT // ARCHIVE_EMPTY</div>
        <p className="terminal-secondary">PROMPT&gt; LOCATE /PUBLIC_PROFILE</p>
        <h1 id="not-found-title">Archive not found</h1>
        <p>The published portfolio profile is not available.</p>
        <Link className="terminal-button" href="/">
          RETURN /ROOT
        </Link>
      </section>
    </main>
  )
}
