import { TerminalEffects } from './terminal-effects'

export default function Loading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="terminal-page"
      id="main-content"
    >
      <TerminalEffects />
      <div className="terminal-app">
        <div className="terminal-shell terminal-loading-shell">
          <header className="terminal-header">
            <span>SYSTEM_SESSION: MARK_ANGEL_ARCHIVE_V4.1</span>
            <span aria-hidden="true">_ _ _</span>
          </header>
          <section
            aria-label="Loading portfolio"
            className="terminal-loading-content"
          >
            <p className="terminal-secondary">PROMPT&gt; LOAD_ARCHIVE</p>
            <div className="terminal-loading-block terminal-loading-kicker" />
            <div className="terminal-loading-block terminal-loading-title" />
            <div className="terminal-loading-block terminal-loading-copy" />
            <div className="terminal-loading-block terminal-loading-action" />
            <div className="terminal-loading-grid" aria-hidden="true">
              <div className="terminal-loading-block terminal-loading-panel" />
              <div className="terminal-loading-block terminal-loading-panel" />
            </div>
          </section>
          <footer className="terminal-header terminal-footer">
            <span>CHANNEL: OWNER@GMAIL.COM</span>
            <span>PKT_LOSS: 0%</span>
            <span>ENCRYPT: API_GUARDED</span>
            <span>PUBLIC_ARCHIVE</span>
          </footer>
        </div>
      </div>
    </main>
  )
}
