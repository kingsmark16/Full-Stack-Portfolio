import { HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PortfolioService } from './portfolio.service'

describe('PortfolioService', () => {
  const profileFindFirst = jest.fn()
  const skillFindMany = jest.fn()
  const experienceFindMany = jest.fn()
  const educationFindMany = jest.fn()
  const certificationFindMany = jest.fn()
  const serviceFindMany = jest.fn()
  const projectFindMany = jest.fn()

  const prisma = {
    profile: {
      findFirst: profileFindFirst,
    },
    skill: {
      findMany: skillFindMany,
    },
    experience: {
      findMany: experienceFindMany,
    },
    education: {
      findMany: educationFindMany,
    },
    certification: {
      findMany: certificationFindMany,
    },
    service: {
      findMany: serviceFindMany,
    },
    project: {
      findMany: projectFindMany,
    },
  } as unknown as PrismaService

  const portfolioService = new PortfolioService(prisma)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 404 when the profile is not published', async () => {
    profileFindFirst.mockResolvedValue(null)

    const result = await portfolioService
      .getPublicPortfolio()
      .catch((error: unknown) => error)

    expect(result).toBeInstanceOf(HttpException)
    expect((result as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
  })

  it('returns the published profile and public sections', async () => {
    profileFindFirst.mockResolvedValue({
      name: 'Mark Angel',
      biography: 'Full stack developer',
      avatarUrl: null,
      contactEmail: 'owner@gmail.com',
      phoneNumber: null,
      resumeUrl: null,
    })

    skillFindMany.mockResolvedValue([{ name: 'Next.js', iconUrl: null }])
    experienceFindMany.mockResolvedValue([])
    educationFindMany.mockResolvedValue([])
    certificationFindMany.mockResolvedValue([])
    serviceFindMany.mockResolvedValue([])
    projectFindMany.mockResolvedValue([])

    await expect(portfolioService.getPublicPortfolio()).resolves.toEqual({
      profile: {
        name: 'Mark Angel',
        biography: 'Full stack developer',
        avatarUrl: null,
        contactEmail: 'owner@gmail.com',
        phoneNumber: null,
        resumeUrl: null,
      },
      skills: [{ name: 'Next.js', iconUrl: null }],
      experience: [],
      education: [],
      certifications: [],
      services: [],
      projects: [],
    })
  })

  it('AC-2 queries public sections with published filters and deterministic ordering', async () => {
    profileFindFirst.mockResolvedValue({
      name: 'Mark Angel',
      biography: 'Full stack developer',
      avatarUrl: null,
      contactEmail: 'owner@gmail.com',
      phoneNumber: null,
      resumeUrl: null,
    })

    skillFindMany.mockResolvedValue([])
    experienceFindMany.mockResolvedValue([])
    educationFindMany.mockResolvedValue([])
    certificationFindMany.mockResolvedValue([])
    serviceFindMany.mockResolvedValue([])
    projectFindMany.mockResolvedValue([])

    await portfolioService.getPublicPortfolio()

    expect(skillFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        take: 100,
      }),
    )
    expect(experienceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        take: 100,
      }),
    )
    expect(educationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        take: 100,
      }),
    )
    expect(certificationFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        take: 100,
      }),
    )
    expect(serviceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        take: 100,
      }),
    )
    expect(projectFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { published: true },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        take: 100,
      }),
    )
  })

  it('AC-2 orders project technologies by their display order', async () => {
    profileFindFirst.mockResolvedValue({
      name: 'Mark Angel',
      biography: 'Full stack developer',
      avatarUrl: null,
      contactEmail: 'owner@gmail.com',
      phoneNumber: null,
      resumeUrl: null,
    })

    skillFindMany.mockResolvedValue([])
    experienceFindMany.mockResolvedValue([])
    educationFindMany.mockResolvedValue([])
    certificationFindMany.mockResolvedValue([])
    serviceFindMany.mockResolvedValue([])
    projectFindMany.mockResolvedValue([
      {
        title: 'Portfolio',
        slug: 'portfolio',
        description: 'A portfolio project',
        imageUrl: null,
        projectUrl: null,
        repositoryUrl: null,
        startMonth: null,
        endMonth: null,
        skills: [
          { skill: { name: 'Zod', iconUrl: null, displayOrder: 2 } },
          { skill: { name: 'Next.js', iconUrl: null, displayOrder: 1 } },
        ],
      },
    ])

    const result = await portfolioService.getPublicPortfolio()

    expect(result.projects[0]?.skills).toEqual([
      { name: 'Next.js', iconUrl: null },
      { name: 'Zod', iconUrl: null },
    ])
  })
})
