import type { Metadata } from 'next'
import {
  getPortfolio,
  isSafeExternalUrl,
  type PortfolioPayload,
} from '@/lib/portfolio'
import { ContactForm } from './contact-form'
import { RetryButton } from './retry-button'
import { TerminalEffects } from './terminal-effects'

/* eslint-disable @next/next/no-img-element -- API supplied media URLs cannot use a fixed remote host allowlist. */

export const dynamic = 'force-dynamic'

function resolveWebOrigin(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!configuredUrl) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_SITE_URL is required in production')
    }

    return 'http://localhost:3000'
  }

  try {
    const url = new URL(configuredUrl)
    const isDevelopmentHttp =
      process.env.NODE_ENV !== 'production' && url.protocol === 'http:'

    if (url.protocol !== 'https:' && !isDevelopmentHttp) {
      throw new Error('NEXT_PUBLIC_SITE_URL must use HTTPS in production')
    }

    return url.origin
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_PUBLIC')) {
      throw error
    }

    throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute URL')
  }
}

const webOrigin = resolveWebOrigin()

function terminalToken(value: string): string {
  const token = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return token || 'PUBLIC'
}

function profileInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return initials || 'MA'
}

export async function generateMetadata(): Promise<Metadata> {
  let portfolio: PortfolioPayload | null = null

  try {
    portfolio = await getPortfolio()
  } catch {
    portfolio = null
  }

  const name = portfolio?.profile.name ?? 'Mark Angel'
  const description = portfolio
    ? portfolio.profile.biography.replace(/\s+/g, ' ').trim().slice(0, 160)
    : 'Full stack developer building useful web experiences.'
  const title = `${name} | Full Stack Developer`
  const image =
    portfolio?.profile.avatarUrl &&
    isSafeExternalUrl(portfolio.profile.avatarUrl)
      ? portfolio.profile.avatarUrl
      : `${webOrigin}/og-default.svg`

  return {
    title,
    description,
    alternates: { canonical: `${webOrigin}/` },
    openGraph: {
      type: 'website',
      url: `${webOrigin}/`,
      title,
      description,
      images: [{ url: image }],
    },
  }
}

function commandSection(command: string, heading: string, id: string) {
  return (
    <div className="command-heading">
      <span>PROMPT&gt;</span>
      <h2 id={id}>{command}</h2>
      <div aria-hidden="true" />
      <p>{heading}</p>
    </div>
  )
}

function unavailablePage() {
  return (
    <main className="terminal-error" id="main-content">
      <TerminalEffects />
      <section className="terminal-error-panel" aria-labelledby="error-title">
        <div className="terminal-header">SYSTEM_ALERT // CONNECTION_LOST</div>
        <p className="terminal-secondary">PROMPT&gt; RETRY_CONNECTION</p>
        <h1 id="error-title">Content is unavailable</h1>
        <p>The portfolio could not be loaded right now.</p>
        <RetryButton />
      </section>
    </main>
  )
}

export default async function Home() {
  let portfolio: PortfolioPayload | null = null

  try {
    portfolio = await getPortfolio()
  } catch {
    portfolio = null
  }

  if (!portfolio) {
    return unavailablePage()
  }

  const { profile, skills, services } = portfolio
  const projects = portfolio.projects.slice(0, 5)
  const skillGroupCount = Math.min(3, Math.max(skills.length, 1))
  const skillsPerGroup = Math.ceil(skills.length / skillGroupCount)
  const sessionName = terminalToken(profile.name)
  const initials = profileInitials(profile.name)
  const avatarUrl =
    profile.avatarUrl && isSafeExternalUrl(profile.avatarUrl)
      ? profile.avatarUrl
      : null
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: `${webOrigin}/`,
    image: avatarUrl ?? `${webOrigin}/og-default.svg`,
    jobTitle: 'Full Stack Developer',
    description: profile.biography.replace(/\s+/g, ' ').trim().slice(0, 160),
  }

  return (
    <main className="terminal-page" id="main-content">
      <TerminalEffects />
      <a className="skip-link" href="#terminal-content">
        Skip to archive content
      </a>

      <div className="terminal-app">
        <div className="terminal-shell stream-in">
          <header className="terminal-header">
            <span>SYSTEM_SESSION: {sessionName}_ARCHIVE_V4.1</span>
            <span aria-hidden="true">_ [ ] X</span>
          </header>

          <nav
            className="terminal-nav stream-in"
            aria-label="Primary navigation"
          >
            <a className="glitch-hover" href="#hero">
              CD /ROOT
            </a>
            {projects.length > 0 ? (
              <a className="glitch-hover" href="#projects">
                LS /PROJECTS
              </a>
            ) : null}
            {skills.length > 0 ? (
              <a className="glitch-hover" href="#skills">
                CAT /SPECS
              </a>
            ) : null}
            {services.length > 0 ? (
              <a className="glitch-hover" href="#services">
                LIST /SERVICES
              </a>
            ) : null}
            <a className="glitch-hover" href="#contact">
              SSH /CONNECT
            </a>
          </nav>

          <div className="terminal-content" id="terminal-content">
            <section
              className="hero-terminal stream-in"
              id="hero"
              aria-labelledby="hero-title"
            >
              <div>
                <pre className="ascii-art" aria-hidden="true">
                  {profile.name.toUpperCase()}
                </pre>
                <p className="whoami-line">
                  <span>PROMPT&gt;</span> WHOAMI
                  <span
                    className="cursor-blink-underscore"
                    aria-hidden="true"
                  />
                </p>
                <h1 id="hero-title">{profile.name}</h1>
                <p className="terminal-secondary">Full stack developer</p>
                <p className="hero-description">{profile.biography}</p>
                <div className="terminal-actions">
                  {projects.length > 0 ? (
                    <a
                      className="terminal-button glitch-hover"
                      href="#projects"
                    >
                      RUN ./inspect_projects
                    </a>
                  ) : null}
                  <a className="terminal-button glitch-hover" href="#contact">
                    RUN ./init_sequence
                  </a>
                  {profile.resumeUrl && isSafeExternalUrl(profile.resumeUrl) ? (
                    <a
                      className="terminal-button glitch-hover"
                      href={profile.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      SUDO ./download_cv
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="portrait-terminal terminal-border">
                <div className="terminal-header">DATA_VISUAL: M_001.JPG</div>
                {avatarUrl ? (
                  <img
                    className="pixelated glitch-hover"
                    src={avatarUrl}
                    alt={`${profile.name} portrait`}
                  />
                ) : (
                  <div
                    className="portrait-fallback"
                    role="img"
                    aria-label={`${profile.name} avatar fallback`}
                  >
                    <span>{`{ ${initials} }`}</span>
                    <small>PORTRAIT_ASSET_UNAVAILABLE</small>
                  </div>
                )}
              </div>
            </section>

            {projects.length > 0 ? (
              <section
                className="terminal-section stream-in"
                id="projects"
                aria-labelledby="projects-title"
              >
                {commandSection(
                  'LS /PROJECTS -A',
                  'PROJECT_LOGS',
                  'projects-title',
                )}
                <div className="project-log-grid">
                  {projects.map((project, index) => (
                    <article
                      className="project-log terminal-border glitch-hover"
                      key={project.slug}
                    >
                      {project.imageUrl &&
                      isSafeExternalUrl(project.imageUrl) ? (
                        <img
                          className="pixelated project-preview"
                          src={project.imageUrl}
                          alt={`${project.title} project preview`}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="project-preview project-preview-fallback"
                          aria-hidden="true"
                        >
                          <span>ASSET_MISSING</span>
                        </div>
                      )}
                      <div className="project-log-copy">
                        <p className="terminal-secondary">
                          PROJECT_{String(index + 1).padStart(2, '0')}
                          {' // '}
                          {project.slug}
                        </p>
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                        {project.skills.length > 0 ? (
                          <ul
                            className="terminal-tags"
                            aria-label={`${project.title} technologies`}
                          >
                            {project.skills.map((skill) => (
                              <li key={skill.name}>{skill.name}</li>
                            ))}
                          </ul>
                        ) : null}
                        <div className="project-links">
                          {project.projectUrl &&
                          isSafeExternalUrl(project.projectUrl) ? (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              OPEN_PROJECT ↗
                            </a>
                          ) : null}
                          {project.repositoryUrl &&
                          isSafeExternalUrl(project.repositoryUrl) ? (
                            <a
                              href={project.repositoryUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              SOURCE ↗
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {skills.length > 0 ? (
              <section
                className="terminal-section stream-in"
                id="skills"
                aria-labelledby="skills-title"
              >
                {commandSection(
                  'CAT /SPECS',
                  'SYSTEM_SPECIMENS',
                  'skills-title',
                )}
                <div className="skill-specimens terminal-border">
                  {Array.from({ length: skillGroupCount }, (_, group) => {
                    const groupSkills = skills.slice(
                      group * skillsPerGroup,
                      (group + 1) * skillsPerGroup,
                    )
                    return groupSkills.length > 0 ? (
                      <div className="specimen-group" key={group}>
                        <p>
                          GROUP_{String(group + 1).padStart(2, '0')}:
                          SKILL_INDEX
                        </p>
                        <ul>
                          {groupSkills.map((skill) => (
                            <li key={skill.name}>
                              <span>{skill.name}</span>
                              {skill.iconUrl &&
                              isSafeExternalUrl(skill.iconUrl) ? (
                                <img
                                  src={skill.iconUrl}
                                  alt=""
                                  loading="lazy"
                                />
                              ) : (
                                <em>LOADED</em>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  })}
                </div>
              </section>
            ) : null}

            {services.length > 0 ? (
              <section
                className="terminal-section stream-in"
                id="services"
                aria-labelledby="services-title"
              >
                {commandSection(
                  'LIST /SERVICES',
                  'AVAILABLE_SYSTEMS',
                  'services-title',
                )}
                <div className="supporting-records">
                  {services.map((service) => (
                    <article
                      className="supporting-record terminal-border"
                      key={service.name}
                    >
                      <p className="terminal-secondary">SERVICE_READY</p>
                      <h3>{service.name}</h3>
                      <p>{service.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section
              className="terminal-contact stream-in"
              id="contact"
              aria-labelledby="contact-title"
            >
              <div className="contact-terminal terminal-border">
                <div className="terminal-header terminal-header-amber">
                  INITIALIZE_COMMS // SECURE_UPLINK
                </div>
                <h2 id="contact-title" className="sr-only">
                  Contact channel
                </h2>
                <p className="contact-intro">
                  &gt;&gt; Have a project in mind or want to start a
                  conversation?
                </p>
                <p className="contact-email">
                  DIRECT_CHANNEL:{' '}
                  <a href={`mailto:${profile.contactEmail}`}>
                    {profile.contactEmail}
                  </a>
                </p>
                <ContactForm />
              </div>
            </section>
          </div>

          <footer className="terminal-footer terminal-header">
            <span>CHANNEL: {profile.contactEmail}</span>
            <span>PKT_LOSS: 0%</span>
            <span>ENCRYPT: API_GUARDED</span>
            <span>PUBLIC_ARCHIVE</span>
          </footer>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      <nav className="mobile-terminal-nav" aria-label="Mobile navigation">
        <a href="#hero">ROOT</a>
        {projects.length > 0 ? <a href="#projects">LOG</a> : null}
        {skills.length > 0 ? <a href="#skills">SPEC</a> : null}
        {services.length > 0 ? <a href="#services">SERV</a> : null}
        <a href="#contact">SSH</a>
      </nav>
    </main>
  )
}
