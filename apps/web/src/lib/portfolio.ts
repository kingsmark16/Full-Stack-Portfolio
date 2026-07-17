export type PortfolioProfile = {
  name: string
  biography: string
  avatarUrl: string | null
  contactEmail: string
  phoneNumber: string | null
  resumeUrl: string | null
}

export type PortfolioSkill = {
  name: string
  iconUrl: string | null
}

export type PortfolioExperience = {
  company: string
  role: string
  location: string | null
  startMonth: string
  endMonth: string | null
  current: boolean
  description: string
}

export type PortfolioEducation = {
  institution: string
  degree: string
  location: string | null
  startYear: number
  endYear: number | null
  current: boolean
}

export type PortfolioCertification = {
  name: string
  issuingOrganization: string
  issueYear: number
  credentialUrl: string | null
}

export type PortfolioService = {
  name: string
  description: string
  iconUrl: string | null
}

export type PortfolioProject = {
  title: string
  slug: string
  description: string
  imageUrl: string | null
  projectUrl: string | null
  repositoryUrl: string | null
  startMonth: string | null
  endMonth: string | null
  skills: PortfolioSkill[]
}

export type PortfolioPayload = {
  profile: PortfolioProfile
  skills: PortfolioSkill[]
  experience: PortfolioExperience[]
  education: PortfolioEducation[]
  certifications: PortfolioCertification[]
  services: PortfolioService[]
  projects: PortfolioProject[]
}

const apiInternalUrl = (
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '')

export async function getPortfolio(): Promise<PortfolioPayload | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)

  try {
    const response = await fetch(`${apiInternalUrl}/portfolio`, {
      signal: controller.signal,
      next: {
        revalidate: 60,
        tags: ['portfolio'],
      },
    })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as PortfolioPayload
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}
