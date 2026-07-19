import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getPortfolio,
  PortfolioNotFoundError,
  type PortfolioPayload,
} from '@/lib/portfolio'
import { ContactForm } from './contact-form'
import { RetryButton } from './retry-button'
import { TerminalEffects } from './terminal-effects'

/* eslint-disable @next/next/no-img-element -- API supplied media URLs cannot use a fixed remote host allowlist. */

export const dynamic = 'force-dynamic'

const webOrigin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

function terminalToken(value: string): string {
  const token = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return token || 'PUBLIC'
}

export async function generateMetadata(): Promise<Metadata> {
  let portfolio: PortfolioPayload | null = null

  try {
    portfolio = await getPortfolio()
  } catch (error) {
    if (error instanceof PortfolioNotFoundError) {
      return {
        title: 'TERMINAL_ACCESS | Portfolio',
        description: 'Professional portfolio',
        alternates: { canonical: `${webOrigin}/` },
      }
    }
  }

  const title = portfolio
    ? `TERMINAL_ACCESS | ${portfolio.profile.name}`
    : 'TERMINAL_ACCESS | Portfolio'
  const description = portfolio
    ? portfolio.profile.biography.replace(/\s+/g, ' ').trim().slice(0, 160)
    : 'Professional portfolio'

  return {
    title,
    description,
    alternates: { canonical: `${webOrigin}/` },
    openGraph: {
      type: 'website',
      url: `${webOrigin}/`,
      title,
      description,
      images: [
        {
          url: portfolio?.profile.avatarUrl
            ? portfolio.profile.avatarUrl
            : `${webOrigin}/og-default.svg`,
        },
      ],
    },
  }
}

function formatRange(start: string, end: string | null, current: boolean) {
  return `${start} — ${current ? 'PRESENT' : (end ?? 'ARCHIVED')}`
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

export default async function Home() {
  let portfolio: PortfolioPayload | null = null

  try {
    portfolio = await getPortfolio()
  } catch (error) {
    if (error instanceof PortfolioNotFoundError) {
      notFound()
    }
  }

  if (!portfolio) {
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

  const {
    profile,
    skills,
    experience,
    education,
    certifications,
    services,
    projects,
  } = portfolio
  const sessionName = terminalToken(profile.name)

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
              <a className="glitch-hover" href="#work">
                LS /PROJECTS
              </a>
            ) : null}
            {skills.length > 0 ? (
              <a className="glitch-hover" href="#skills">
                CAT /SPECS
              </a>
            ) : null}
            {experience.length > 0 ? (
              <a className="glitch-hover" href="#journey">
                READ /HISTORY
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
                <p className="terminal-secondary">
                  &gt;&gt; FULL STACK DEVELOPER
                </p>
                <p className="hero-description">{profile.biography}</p>
                <div className="terminal-actions">
                  <a className="terminal-button glitch-hover" href="#contact">
                    RUN ./init_sequence
                  </a>
                  {profile.resumeUrl ? (
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
                {profile.avatarUrl ? (
                  <img
                    className="pixelated glitch-hover"
                    src={profile.avatarUrl}
                    alt={`${profile.name} portrait`}
                  />
                ) : (
                  <div
                    className="portrait-fallback"
                    aria-label="No profile image supplied"
                  >
                    <span>{'{ MA }'}</span>
                    <small>PORTRAIT_ASSET_UNAVAILABLE</small>
                  </div>
                )}
              </div>
            </section>

            {projects.length > 0 ? (
              <section
                className="terminal-section stream-in"
                id="work"
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
                      {project.imageUrl ? (
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
                          {project.projectUrl ? (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              OPEN_PROJECT ↗
                            </a>
                          ) : null}
                          {project.repositoryUrl ? (
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
                  {[0, 1, 2].map((group) => {
                    const groupSkills = skills.filter(
                      (_, index) => index % 3 === group,
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
                              {skill.iconUrl ? (
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

            {experience.length > 0 ? (
              <section
                className="terminal-section stream-in"
                id="journey"
                aria-labelledby="history-title"
              >
                {commandSection(
                  'READ /HISTORY',
                  'BUILD_HISTORY',
                  'history-title',
                )}
                <ol className="terminal-history">
                  {experience.map((item, index) => (
                    <li
                      className="history-entry"
                      key={`${item.company}-${item.role}`}
                    >
                      <span>[{String(index + 1).padStart(2, '0')}]</span>
                      <div>
                        <p>
                          STAMP:{' '}
                          {formatRange(
                            item.startMonth,
                            item.endMonth,
                            item.current,
                          )}
                        </p>
                        <h3>{item.role}</h3>
                        <small>
                          {item.company}
                          {item.location ? ` // ${item.location}` : ''}
                        </small>
                        <p>{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {education.length > 0 ||
            certifications.length > 0 ||
            services.length > 0 ? (
              <section
                className="terminal-section stream-in"
                aria-label="Supporting archive records"
              >
                <div className="supporting-records">
                  {education.length > 0 ? (
                    <section
                      className="supporting-record terminal-border"
                      aria-labelledby="education-title"
                    >
                      <p className="terminal-secondary">READ /EDUCATION</p>
                      <h2 id="education-title">Training data</h2>
                      <ul>
                        {education.map((item) => (
                          <li key={`${item.institution}-${item.degree}`}>
                            <strong>{item.degree}</strong>
                            <span>{item.institution}</span>
                            <small>
                              {item.startYear} —{' '}
                              {item.current
                                ? 'PRESENT'
                                : (item.endYear ?? 'ARCHIVED')}
                            </small>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {certifications.length > 0 ? (
                    <section
                      className="supporting-record terminal-border"
                      aria-labelledby="certifications-title"
                    >
                      <p className="terminal-secondary">VERIFY /CERTS</p>
                      <h2 id="certifications-title">Signals</h2>
                      <ul>
                        {certifications.map((item) => (
                          <li key={`${item.name}-${item.issueYear}`}>
                            <strong>{item.name}</strong>
                            <span>{item.issuingOrganization}</span>
                            <small>{item.issueYear}</small>
                            {item.credentialUrl ? (
                              <a
                                href={item.credentialUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                VERIFY ↗
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {services.length > 0 ? (
                    <section
                      className="supporting-record terminal-border"
                      aria-labelledby="services-title"
                    >
                      <p className="terminal-secondary">LIST /SERVICES</p>
                      <h2 id="services-title">Available systems</h2>
                      <ul>
                        {services.map((service) => (
                          <li key={service.name}>
                            <strong>{service.name}</strong>
                            <span>{service.description}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
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

      <nav className="mobile-terminal-nav" aria-label="Mobile navigation">
        <a href="#hero">ROOT</a>
        {projects.length > 0 ? <a href="#work">LOG</a> : null}
        {skills.length > 0 ? <a href="#skills">SPEC</a> : null}
        <a href="#contact">SSH</a>
      </nav>
    </main>
  )
}
