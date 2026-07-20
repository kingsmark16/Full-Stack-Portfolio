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

export class PortfolioNotFoundError extends Error {
  constructor() {
    super('The published portfolio profile is not available')
    this.name = 'PortfolioNotFoundError'
  }
}

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' ||
      (process.env.NODE_ENV !== 'production' && url.protocol === 'http:')
    )
  } catch {
    return false
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function isNullableSafeExternalUrl(value: unknown): value is string | null {
  return value === null || (isString(value) && isSafeExternalUrl(value))
}

function isPortfolioSkill(value: unknown): value is PortfolioSkill {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isNullableSafeExternalUrl(value.iconUrl)
  )
}

function isPortfolioProfile(value: unknown): value is PortfolioProfile {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isString(value.biography) &&
    isNullableSafeExternalUrl(value.avatarUrl) &&
    isString(value.contactEmail) &&
    isNullableString(value.phoneNumber) &&
    isNullableSafeExternalUrl(value.resumeUrl)
  )
}

function isPortfolioExperience(value: unknown): value is PortfolioExperience {
  return (
    isRecord(value) &&
    isString(value.company) &&
    isString(value.role) &&
    isNullableString(value.location) &&
    isString(value.startMonth) &&
    isNullableString(value.endMonth) &&
    isBoolean(value.current) &&
    isString(value.description)
  )
}

function isPortfolioEducation(value: unknown): value is PortfolioEducation {
  return (
    isRecord(value) &&
    isString(value.institution) &&
    isString(value.degree) &&
    isNullableString(value.location) &&
    isNumber(value.startYear) &&
    isNullableNumber(value.endYear) &&
    isBoolean(value.current)
  )
}

function isPortfolioCertification(
  value: unknown,
): value is PortfolioCertification {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isString(value.issuingOrganization) &&
    isNumber(value.issueYear) &&
    isNullableSafeExternalUrl(value.credentialUrl)
  )
}

function isPortfolioService(value: unknown): value is PortfolioService {
  return (
    isRecord(value) &&
    isString(value.name) &&
    isString(value.description) &&
    isNullableSafeExternalUrl(value.iconUrl)
  )
}

function isPortfolioProject(value: unknown): value is PortfolioProject {
  return (
    isRecord(value) &&
    isString(value.title) &&
    isString(value.slug) &&
    isString(value.description) &&
    isNullableSafeExternalUrl(value.imageUrl) &&
    isNullableSafeExternalUrl(value.projectUrl) &&
    isNullableSafeExternalUrl(value.repositoryUrl) &&
    isNullableString(value.startMonth) &&
    isNullableString(value.endMonth) &&
    Array.isArray(value.skills) &&
    value.skills.every(isPortfolioSkill)
  )
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isNumber(value)
}

function isPortfolioPayload(value: unknown): value is PortfolioPayload {
  return (
    isRecord(value) &&
    isPortfolioProfile(value.profile) &&
    Array.isArray(value.skills) &&
    value.skills.every(isPortfolioSkill) &&
    Array.isArray(value.experience) &&
    value.experience.every(isPortfolioExperience) &&
    Array.isArray(value.education) &&
    value.education.every(isPortfolioEducation) &&
    Array.isArray(value.certifications) &&
    value.certifications.every(isPortfolioCertification) &&
    Array.isArray(value.services) &&
    value.services.every(isPortfolioService) &&
    Array.isArray(value.projects) &&
    value.projects.every(isPortfolioProject)
  )
}

const apiInternalUrl = (
  process.env.API_INTERNAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '')

export async function getPortfolio(): Promise<PortfolioPayload | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)

  try {
    const response = await fetch(`${apiInternalUrl}/portfolio`, {
      cache: 'no-store',
      signal: controller.signal,
    })

    if (response.status === 404) {
      throw new PortfolioNotFoundError()
    }

    if (!response.ok) {
      return null
    }

    const payload: unknown = await response.json()

    return isPortfolioPayload(payload) ? payload : null
  } catch (error) {
    if (error instanceof PortfolioNotFoundError) {
      throw error
    }

    return null
  } finally {
    clearTimeout(timeout)
  }
}
