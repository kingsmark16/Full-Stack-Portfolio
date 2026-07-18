import type { Metadata } from 'next'
import { getPortfolio } from '@/lib/portfolio'
import { RetryButton } from './retry-button'
import { ContactForm } from './contact-form'

export const dynamic = 'force-dynamic'

const webOrigin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export async function generateMetadata(): Promise<Metadata> {
  const portfolio = await getPortfolio()
  const title = portfolio ? `${portfolio.profile.name} Portfolio` : 'Portfolio'
  const description = portfolio
    ? portfolio.profile.biography.replace(/\s+/g, ' ').trim().slice(0, 160)
    : 'Professional portfolio'

  return {
    title,
    description,
    alternates: {
      canonical: `${webOrigin}/`,
    },
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

export default async function Home() {
  const portfolio = await getPortfolio()

  if (!portfolio) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <section className="max-w-md text-center">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-zinc-500">
            Portfolio
          </p>
          <h1 className="text-3xl font-semibold">Content is unavailable</h1>
          <p className="mt-4 text-zinc-400">
            The portfolio could not be loaded right now.
          </p>
          <div className="mt-8">
            <RetryButton />
          </div>
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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-24">
        <section className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Full stack developer
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-7xl">
            {profile.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            {profile.biography}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#contact"
              className="rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Contact me
            </a>
            {profile.resumeUrl ? (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-400"
              >
                View resume
              </a>
            ) : null}
          </div>
        </section>

        {skills.length > 0 ? (
          <section className="mt-24 border-t border-zinc-800 pt-10">
            <h2 className="text-2xl font-semibold">Skills</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span
                  key={skill.name}
                  className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {projects.length > 0 ? (
          <section className="mt-24 border-t border-zinc-800 pt-10">
            <h2 className="text-2xl font-semibold">Selected projects</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.slug}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6"
                >
                  <h3 className="text-xl font-medium">{project.title}</h3>
                  <p className="mt-3 leading-7 text-zinc-400">
                    {project.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <span key={skill.name} className="text-sm text-zinc-500">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {experience.length > 0 ? (
          <section className="mt-24 border-t border-zinc-800 pt-10">
            <h2 className="text-2xl font-semibold">Experience</h2>
            <div className="mt-8 space-y-8">
              {experience.map((item) => (
                <article key={`${item.company}-${item.role}`}>
                  <p className="text-sm text-zinc-500">
                    {item.startMonth} – {item.endMonth ?? 'Present'}
                  </p>
                  <h3 className="mt-2 text-xl font-medium">{item.role}</h3>
                  <p className="mt-1 text-zinc-400">
                    {item.company}
                    {item.location ? `, ${item.location}` : ''}
                  </p>
                  <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {education.length > 0 ||
        certifications.length > 0 ||
        services.length > 0 ? (
          <section className="mt-24 grid gap-12 border-t border-zinc-800 pt-10 md:grid-cols-3">
            {education.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold">Education</h2>
                <div className="mt-5 space-y-5">
                  {education.map((item) => (
                    <article key={`${item.institution}-${item.degree}`}>
                      <h3 className="font-medium">{item.degree}</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {item.institution}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {item.startYear} – {item.endYear ?? 'Present'}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {certifications.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold">Certifications</h2>
                <div className="mt-5 space-y-5">
                  {certifications.map((item) => (
                    <article key={`${item.name}-${item.issueYear}`}>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {item.issuingOrganization}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {item.issueYear}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {services.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold">Services</h2>
                <div className="mt-5 space-y-5">
                  {services.map((service) => (
                    <article key={service.name}>
                      <h3 className="font-medium">{service.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">
                        {service.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section id="contact" className="mt-24 border-t border-zinc-800 pt-10">
          <h2 className="text-2xl font-semibold">Get in touch</h2>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Have a project in mind or want to start a conversation?
          </p>
          <ContactForm />
        </section>
      </div>
    </main>
  )
}
