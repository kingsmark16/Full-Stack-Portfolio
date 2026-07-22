import type { Metadata } from 'next'
import {
  getPortfolio,
  isSafeExternalUrl,
  type PortfolioPayload,
} from '@/lib/portfolio'
import { ContactForm } from './contact-form'
import { RetryButton } from './retry-button'
import { SiteNavigation } from './site-navigation'

/* eslint-disable @next/next/no-img-element -- API supplied media URLs cannot use a fixed remote host allowlist. */

export const dynamic = 'force-dynamic'

const stitchProjectImages = [
  '/stitch/neon-toxic/project-alpha.jpg',
  '/stitch/neon-toxic/project-beta.jpg',
]

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

function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

function formatExperienceDates(
  startMonth: string,
  endMonth: string | null,
  current: boolean,
): string {
  const endLabel = current || !endMonth ? 'Present' : formatMonth(endMonth)
  return `${formatMonth(startMonth)} — ${endLabel}`
}

function formatEducationDates(
  startYear: number,
  endYear: number | null,
  current: boolean,
): string {
  return `${startYear} — ${current || !endYear ? 'Present' : endYear}`
}

function skillCode(name: string): string {
  const words = name.match(/[A-Za-z0-9]+/g) ?? []
  const code = words
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
  return code.toUpperCase() || 'SYS'
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

function SectionHeading({
  title,
  code,
  index,
  id,
  query,
}: {
  title: string
  code: string
  index: string
  id: string
  query?: string
}) {
  return (
    <header className="section-heading">
      <div className="section-signal">
        <span>{`${code} // ${index}`}</span>
        <span className="signal-line" aria-hidden="true" />
      </div>
      <div className="section-title-row">
        <h2 id={id}>{title}</h2>
        {query ? <p>{query}</p> : null}
      </div>
    </header>
  )
}

function unavailablePage() {
  return (
    <main className="public-page" id="main-content">
      <section className="page-state cyber-frame" aria-labelledby="error-title">
        <p className="state-code">ERR.CONTENT // 404</p>
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

  const { profile, skills, services, experience, education, certifications } =
    portfolio
  const projects = portfolio.projects.slice(0, 5)
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
  const navigationLinks = [
    { href: '#hero', label: 'Home', mobileLabel: 'Home' },
    ...(projects.length > 0
      ? [{ href: '#projects', label: 'Project', mobileLabel: 'Projects' }]
      : []),
    ...(experience.length > 0
      ? [
          {
            href: '#experience',
            label: 'Experience',
            mobileLabel: 'Experience',
          },
        ]
      : []),
    ...(skills.length > 0
      ? [{ href: '#skills', label: 'Skills', mobileLabel: 'Skills' }]
      : []),
    ...(education.length > 0
      ? [{ href: '#education', label: 'Education', mobileLabel: 'Education' }]
      : []),
    ...(certifications.length > 0
      ? [
          {
            href: '#certifications',
            label: 'Certifications',
            mobileLabel: 'Certifications',
          },
        ]
      : []),
    ...(services.length > 0
      ? [{ href: '#services', label: 'Services', mobileLabel: 'Services' }]
      : []),
  ]

  return (
    <main className="public-page" id="main-content">
      <a className="skip-link" href="#content">
        Skip to portfolio content
      </a>

      <header className="site-header">
        <SiteNavigation links={navigationLinks} />
      </header>

      <div className="public-shell" id="content">
        <section
          className="hero-section"
          id="hero"
          aria-labelledby="hero-title"
        >
          <aside className="section-rail" aria-hidden="true">
            SYS.INIT // 01
          </aside>
          <div className="hero-copy">
            <p className="eyebrow">Full stack developer</p>
            <h1 id="hero-title">
              {profile.name.split(/\s+/).map((part) => (
                <span key={part}>{part}</span>
              ))}
            </h1>
            <div
              className="online-status"
              aria-label="System version 2.0.4 online"
            >
              <span aria-hidden="true" />
              <strong>v2.0.4 // ONLINE</strong>
            </div>
            <p className="hero-biography">{profile.biography}</p>
            <div className="hero-actions">
              {projects.length > 0 ? (
                <a className="cyber-button action-link" href="#projects">
                  <span aria-hidden="true">&gt;_</span> EXEC_PROJECTS
                </a>
              ) : null}
              <a
                className="secondary-button action-link"
                href="#contact"
                aria-label="Start a conversation"
              >
                CONNECT
              </a>
              {profile.resumeUrl && isSafeExternalUrl(profile.resumeUrl) ? (
                <a
                  className="secondary-button action-link"
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  GET_RESUME
                </a>
              ) : null}
            </div>
          </div>
          <div className="profile-media-stack">
            <span
              className="media-offset media-offset-violet"
              aria-hidden="true"
            />
            <span
              className="media-offset media-offset-lime"
              aria-hidden="true"
            />
            <div className="profile-media scanline-image">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${profile.name} portrait`} />
              ) : (
                <div
                  className="avatar-fallback"
                  role="img"
                  aria-label={`${profile.name} avatar fallback`}
                >
                  <img src="/stitch/neon-toxic/portrait.jpg" alt="" />
                </div>
              )}
            </div>
            <p className="active-stamp">[STATUS: AVAILABLE]</p>
          </div>
        </section>

        {projects.length > 0 ? (
          <section
            className="content-section projects-section"
            id="projects"
            aria-labelledby="projects-title"
          >
            <SectionHeading
              id="projects-title"
              title="Selected works"
              code="DATA.PRJ"
              index="02"
            />
            <div className="project-grid">
              {projects.map((project, projectIndex) => {
                const projectImage =
                  project.imageUrl && isSafeExternalUrl(project.imageUrl)
                    ? project.imageUrl
                    : stitchProjectImages[
                        projectIndex % stitchProjectImages.length
                      ]

                return (
                  <article
                    className="project-card cyber-frame"
                    key={project.slug}
                  >
                    <div className="project-card-inner">
                      <div
                        className={`project-image project-image-fallback-${projectIndex % stitchProjectImages.length} scanline-image`}
                      >
                        <img
                          src={projectImage}
                          alt={`${project.title} project preview`}
                          loading="lazy"
                        />
                      </div>
                      <div className="record-title-row">
                        <h3>{project.title}</h3>
                      </div>
                      <p>{project.description}</p>
                      <div className="project-card-footer">
                        {project.skills.length > 0 ? (
                          <ul
                            className="tag-list"
                            aria-label={`${project.title} technologies`}
                          >
                            {project.skills.map((skill) => (
                              <li key={skill.name}>{skill.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <span />
                        )}
                        <div className="record-links">
                          {project.projectUrl &&
                          isSafeExternalUrl(project.projectUrl) ? (
                            <a
                              href={project.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              LIVE_LINK →
                            </a>
                          ) : null}
                          {project.repositoryUrl &&
                          isSafeExternalUrl(project.repositoryUrl) ? (
                            <a
                              href={project.repositoryUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              SOURCE_CODE →
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {experience.length > 0 || skills.length > 0 ? (
          <div className="split-grid">
            {experience.length > 0 ? (
              <section
                className="content-section"
                id="experience"
                aria-labelledby="experience-title"
              >
                <SectionHeading
                  id="experience-title"
                  title="Career timeline"
                  code="LOG.EXP"
                  index="03"
                />
                <div className="timeline-list">
                  {experience.map((item) => (
                    <article
                      className="timeline-item"
                      key={`${item.company}-${item.role}-${item.startMonth}`}
                    >
                      <div className="timeline-meta">
                        <time dateTime={item.startMonth}>
                          {formatExperienceDates(
                            item.startMonth,
                            item.endMonth,
                            item.current,
                          )}
                        </time>
                      </div>
                      <h3>{item.role}</h3>
                      <p className="record-accent">
                        @ {item.company}
                        {item.location ? ` | ${item.location}` : ''}
                      </p>
                      <p className="timeline-description">{item.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {skills.length > 0 ? (
              <section
                className="content-section"
                id="skills"
                aria-labelledby="skills-title"
              >
                <SectionHeading
                  id="skills-title"
                  title="Technical arsenal"
                  code="DB.SKILLS"
                  index="04"
                />
                <div className="skills-panel cyber-frame">
                  <header className="panel-status">
                    <span>SKILLS | TOOLS: {skills.length}</span>
                    <span className="status-pulse" aria-hidden="true" />
                  </header>
                  <ul className="skill-list">
                    {skills.map((skill) => (
                      <li key={skill.name}>
                        <strong aria-hidden="true">
                          {skillCode(skill.name)}
                        </strong>
                        <span>{skill.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {education.length > 0 || certifications.length > 0 ? (
          <div className="split-grid">
            {education.length > 0 ? (
              <section
                className="content-section"
                id="education"
                aria-labelledby="education-title"
              >
                <SectionHeading
                  id="education-title"
                  title="Academic bg"
                  code="REC.EDU"
                  index="05"
                />
                <div className="record-list">
                  {education.map((item) => (
                    <article
                      className="education-card cyber-frame"
                      key={`${item.institution}-${item.degree}`}
                    >
                      <div>
                        <h3>{item.degree}</h3>
                        <p>
                          {item.institution}
                          {item.location ? ` | ${item.location}` : ''}
                        </p>
                      </div>
                      <time dateTime={String(item.startYear)}>
                        {formatEducationDates(
                          item.startYear,
                          item.endYear,
                          item.current,
                        )}
                      </time>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {certifications.length > 0 ? (
              <section
                className="content-section"
                id="certifications"
                aria-labelledby="certifications-title"
              >
                <SectionHeading
                  id="certifications-title"
                  title="Credentials"
                  code="AUTH.CRT"
                  index="06"
                />
                <div className="certification-grid">
                  {certifications.map((item) => (
                    <article
                      className="certification-card"
                      key={`${item.name}-${item.issuingOrganization}`}
                    >
                      <span className="verified-mark" aria-hidden="true">
                        ✓
                      </span>
                      <h3>{item.name}</h3>
                      <div className="certification-meta">
                        <span>{item.issuingOrganization}</span>
                        <time dateTime={String(item.issueYear)}>
                          {item.issueYear}
                        </time>
                      </div>
                      {item.credentialUrl &&
                      isSafeExternalUrl(item.credentialUrl) ? (
                        <a
                          className="card-cover-link"
                          href={item.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="sr-only">
                            View {item.name} credential
                          </span>
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {services.length > 0 ? (
          <section
            className="content-section services-section"
            id="services"
            aria-labelledby="services-title"
          >
            <SectionHeading
              id="services-title"
              title="System capabilities"
              code="FUNC.SVC"
              index="07"
            />
            <div className="service-grid">
              {services.map((service, index) => (
                <article
                  className="service-card cyber-frame"
                  key={service.name}
                >
                  <span className="service-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="content-section contact-section"
          id="contact"
          aria-labelledby="contact-title"
        >
          <div className="contact-copy">
            <SectionHeading
              id="contact-title"
              title="Establish uplink"
              code="IO.COMM"
              index="08"
            />
            <p>
              Available for product work, technical collaboration, and focused
              structural builds.
            </p>
            <a
              className="contact-email"
              href={`mailto:${profile.contactEmail}`}
            >
              {profile.contactEmail}
            </a>
            <div className="connection-panel">
              <p>
                <span className="status-pulse" aria-hidden="true" /> CONNECTION
                SECURE
              </p>
              <p>
                Transport: TLS 1.3
                <br />
                Route: DIRECT_EMAIL
              </p>
            </div>
          </div>
          <ContactForm />
        </section>
      </div>

      <footer className="site-footer">
        <div>
          <a className="site-wordmark" href="#hero">
            MC.ANGHEL
          </a>
          <p>
            {`© ${new Date().getFullYear()} ${profile.name.toUpperCase()} // DESIGNED FOR TECHNICAL INTENTIONALITY`}
          </p>
          <p className="footer-status">
            <span className="status-pulse" aria-hidden="true" /> SYSTEM ONLINE
          </p>
        </div>
        <div className="footer-links">
          <a href={`mailto:${profile.contactEmail}`}>[EMAIL]</a>
          {projects.find((project) => project.repositoryUrl)?.repositoryUrl ? (
            <a
              href={
                projects.find((project) => project.repositoryUrl)
                  ?.repositoryUrl ?? '#'
              }
              target="_blank"
              rel="noreferrer"
            >
              [GITHUB]
            </a>
          ) : null}
          <a className="back-to-top" href="#hero" aria-label="Back to top">
            ↑
          </a>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
    </main>
  )
}
