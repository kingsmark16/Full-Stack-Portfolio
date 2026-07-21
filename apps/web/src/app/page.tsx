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

function profileInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return initials || 'MA'
}

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
  return `${formatMonth(startMonth)} to ${endLabel}`
}

function formatEducationDates(
  startYear: number,
  endYear: number | null,
  current: boolean,
): string {
  return `${startYear} to ${current || !endYear ? 'Present' : endYear}`
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
  description,
  id,
}: {
  title: string
  description: string
  id: string
}) {
  return (
    <header className="section-heading">
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </header>
  )
}

function unavailablePage() {
  return (
    <main className="public-page" id="main-content">
      <section className="page-state" aria-labelledby="error-title">
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
  const navigationLinks = [
    { href: '#hero', label: 'Home', mobileLabel: 'Home' },
    ...(projects.length > 0
      ? [{ href: '#projects', label: 'Projects', mobileLabel: 'Projects' }]
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
    { href: '#contact', label: 'Connect', mobileLabel: 'Connect' },
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
          <div className="hero-copy">
            <p>Full stack developer</p>
            <h1 id="hero-title">{profile.name}</h1>
            <p>{profile.biography}</p>
            <div className="hero-actions">
              {projects.length > 0 ? (
                <a className="action-link" href="#projects">
                  View selected work
                </a>
              ) : null}
              <a className="action-link" href="#contact">
                Start a conversation
              </a>
              {profile.resumeUrl && isSafeExternalUrl(profile.resumeUrl) ? (
                <a
                  className="action-link"
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download resume
                </a>
              ) : null}
            </div>
          </div>

          <div className="profile-media">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${profile.name} portrait`} />
            ) : (
              <div
                className="avatar-fallback"
                role="img"
                aria-label={`${profile.name} avatar fallback`}
              >
                {initials}
              </div>
            )}
          </div>
        </section>

        {projects.length > 0 ? (
          <section
            className="content-section"
            id="projects"
            aria-labelledby="projects-title"
          >
            <SectionHeading
              id="projects-title"
              title="Projects"
              description="Selected work and the technologies behind it."
            />
            <div className="record-list">
              {projects.map((project) => (
                <article className="record-card" key={project.slug}>
                  {project.imageUrl && isSafeExternalUrl(project.imageUrl) ? (
                    <img
                      className="project-image"
                      src={project.imageUrl}
                      alt={`${project.title} project preview`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="media-fallback" aria-hidden="true">
                      No project image
                    </div>
                  )}
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    {project.skills.length > 0 ? (
                      <ul
                        className="tag-list"
                        aria-label={`${project.title} technologies`}
                      >
                        {project.skills.map((skill) => (
                          <li key={skill.name}>{skill.name}</li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="record-links">
                      {project.projectUrl &&
                      isSafeExternalUrl(project.projectUrl) ? (
                        <a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View project
                        </a>
                      ) : null}
                      {project.repositoryUrl &&
                      isSafeExternalUrl(project.repositoryUrl) ? (
                        <a
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View source
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {experience.length > 0 ? (
          <section
            className="content-section"
            id="experience"
            aria-labelledby="experience-title"
          >
            <SectionHeading
              id="experience-title"
              title="Experience"
              description="A practical timeline of recent work."
            />
            <div className="record-list">
              {experience.map((item) => (
                <article
                  className="record-card"
                  key={`${item.company}-${item.role}-${item.startMonth}`}
                >
                  <p className="record-meta">
                    {formatExperienceDates(
                      item.startMonth,
                      item.endMonth,
                      item.current,
                    )}
                  </p>
                  <h3>{item.role}</h3>
                  <p>
                    {item.company}
                    {item.location ? `, ${item.location}` : ''}
                  </p>
                  <p>{item.description}</p>
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
              title="Skills"
              description="Technologies I use to make ideas real."
            />
            <ul className="skill-list">
              {skills.map((skill) => (
                <li key={skill.name}>
                  {skill.iconUrl && isSafeExternalUrl(skill.iconUrl) ? (
                    <img src={skill.iconUrl} alt="" loading="lazy" />
                  ) : null}
                  <span>{skill.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {education.length > 0 ? (
          <section
            className="content-section"
            id="education"
            aria-labelledby="education-title"
          >
            <SectionHeading
              id="education-title"
              title="Education"
              description="The ideas and disciplines behind the work."
            />
            <div className="record-list">
              {education.map((item) => (
                <article
                  className="record-card"
                  key={`${item.institution}-${item.degree}`}
                >
                  <p className="record-meta">
                    {formatEducationDates(
                      item.startYear,
                      item.endYear,
                      item.current,
                    )}
                  </p>
                  <h3>{item.degree}</h3>
                  <p>
                    {item.institution}
                    {item.location ? `, ${item.location}` : ''}
                  </p>
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
              title="Certifications"
              description="Selected credentials and continuing practice."
            />
            <div className="record-list">
              {certifications.map((item) => (
                <article
                  className="record-card"
                  key={`${item.name}-${item.issuingOrganization}`}
                >
                  <p className="record-meta">{item.issueYear}</p>
                  <h3>{item.name}</h3>
                  <p>{item.issuingOrganization}</p>
                  {item.credentialUrl &&
                  isSafeExternalUrl(item.credentialUrl) ? (
                    <a
                      href={item.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View credential
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {services.length > 0 ? (
          <section
            className="content-section"
            id="services"
            aria-labelledby="services-title"
          >
            <SectionHeading
              id="services-title"
              title="Services"
              description="Ways I can help with thoughtful digital products."
            />
            <div className="record-list">
              {services.map((service) => (
                <article className="record-card" key={service.name}>
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
          <SectionHeading
            id="contact-title"
            title="Connect"
            description="Have a project in mind or want to start a conversation?"
          />
          <p>
            <a href={`mailto:${profile.contactEmail}`}>
              {profile.contactEmail}
            </a>
          </p>
          <ContactForm />
        </section>

        <footer className="site-footer">
          <p>
            © {new Date().getFullYear()} {profile.name}
          </p>
        </footer>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
    </main>
  )
}
