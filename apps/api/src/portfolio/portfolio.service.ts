import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicPortfolio() {
    const profile = await this.prisma.profile.findFirst({
      where: {
        singletonKey: 'default',
        published: true,
      },
      select: {
        name: true,
        biography: true,
        avatarUrl: true,
        contactEmail: true,
        phoneNumber: true,
        resumeUrl: true,
      },
    })

    if (!profile) {
      throw new HttpException(
        {
          type: 'about:blank',
          title: 'Portfolio not found',
          status: HttpStatus.NOT_FOUND,
          detail: 'The published portfolio profile is not available',
        },
        HttpStatus.NOT_FOUND,
      )
    }

    const [skills, experience, education, certifications, services, projects] =
      await Promise.all([
        this.prisma.skill.findMany({
          where: { published: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          take: 100,
          select: {
            name: true,
            iconUrl: true,
          },
        }),
        this.prisma.experience.findMany({
          where: { published: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          take: 100,
          select: {
            company: true,
            role: true,
            location: true,
            startMonth: true,
            endMonth: true,
            current: true,
            description: true,
          },
        }),
        this.prisma.education.findMany({
          where: { published: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          take: 100,
          select: {
            institution: true,
            degree: true,
            location: true,
            startYear: true,
            endYear: true,
            current: true,
          },
        }),
        this.prisma.certification.findMany({
          where: { published: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          take: 100,
          select: {
            name: true,
            issuingOrganization: true,
            issueYear: true,
            credentialUrl: true,
          },
        }),
        this.prisma.service.findMany({
          where: { published: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          take: 100,
          select: {
            name: true,
            description: true,
            iconUrl: true,
          },
        }),
        this.prisma.project.findMany({
          where: { published: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          take: 100,
          select: {
            title: true,
            slug: true,
            description: true,
            imageUrl: true,
            projectUrl: true,
            repositoryUrl: true,
            startMonth: true,
            endMonth: true,
            skills: {
              select: {
                skill: {
                  select: {
                    name: true,
                    iconUrl: true,
                    displayOrder: true,
                  },
                },
              },
            },
          },
        }),
      ])

    return {
      profile,
      skills,
      experience,
      education,
      certifications,
      services,
      projects: projects.map((project) => ({
        ...project,
        skills: project.skills
          .sort(
            (first, second) =>
              first.skill.displayOrder - second.skill.displayOrder,
          )
          .map(({ skill }) => ({
            name: skill.name,
            iconUrl: skill.iconUrl,
          })),
      })),
    }
  }
}
