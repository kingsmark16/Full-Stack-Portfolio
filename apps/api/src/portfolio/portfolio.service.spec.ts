import { HttpException, HttpStatus } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PortfolioService } from './portfolio.service'

describe('PortfolioService', () => {
  const prisma = {
    profile: {
      findFirst: jest.fn(),
    },
    skill: {
      findMany: jest.fn(),
    },
    experience: {
      findMany: jest.fn(),
    },
    education: {
      findMany: jest.fn(),
    },
    certification: {
      findMany: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
    },
  } as unknown as PrismaService

  const portfolioService = new PortfolioService(prisma)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 404 when the profile is not published', async () => {
    prisma.profile.findFirst = jest.fn().mockResolvedValue(null)

    const result = await portfolioService
      .getPublicPortfolio()
      .catch((error: unknown) => error)

    expect(result).toBeInstanceOf(HttpException)
    expect((result as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
  })

  it('returns the published profile and public sections', async () => {
    prisma.profile.findFirst = jest.fn().mockResolvedValue({
      name: 'Mark Angel',
      biography: 'Full stack developer',
      avatarUrl: null,
      contactEmail: 'owner@gmail.com',
      phoneNumber: null,
      resumeUrl: null,
    })

    prisma.skill.findMany = jest
      .fn()
      .mockResolvedValue([{ name: 'Next.js', iconUrl: null }])
    prisma.experience.findMany = jest.fn().mockResolvedValue([])
    prisma.education.findMany = jest.fn().mockResolvedValue([])
    prisma.certification.findMany = jest.fn().mockResolvedValue([])
    prisma.service.findMany = jest.fn().mockResolvedValue([])
    prisma.project.findMany = jest.fn().mockResolvedValue([])

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
})
