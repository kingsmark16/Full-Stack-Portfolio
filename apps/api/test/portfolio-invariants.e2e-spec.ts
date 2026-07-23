import { randomUUID } from 'node:crypto'
import { PrismaService } from '../src/prisma/prisma.service'

jest.setTimeout(30_000)

type AsyncOperation = () => Promise<unknown>

async function expectConstraintViolation(
  operation: AsyncOperation,
  constraintName: string,
): Promise<void> {
  let error: unknown

  try {
    await operation()
  } catch (caughtError: unknown) {
    error = caughtError
  }

  expect(error).toBeDefined()
  expect(String(error)).toContain(constraintName)
}

describe('Portfolio database invariants (e2e)', () => {
  let prisma: PrismaService

  beforeAll(async () => {
    prisma = new PrismaService()
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('AC-1 rejects invalid singleton, ordering, and current state values', async () => {
    const suffix = randomUUID()

    await expectConstraintViolation(
      () =>
        prisma.profile.create({
          data: {
            singletonKey: `invalid-${suffix}`,
            name: `Invariant profile ${suffix}`,
            biography: 'Database invariant test profile',
            contactEmail: `invariant-${suffix}@example.com`,
          },
        }),
      'Profile_singletonKey_default_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.skill.create({
          data: {
            name: `Invalid skill ${suffix}`,
            displayOrder: -1,
          },
        }),
      'Skill_displayOrder_nonnegative_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.experience.create({
          data: {
            company: `Invalid company ${suffix}`,
            role: 'Developer',
            startMonth: '2026-01',
            current: false,
            endMonth: null,
            description: 'Invalid completed experience',
            displayOrder: 0,
          },
        }),
      'Experience_current_endMonth_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.education.create({
          data: {
            institution: `Invalid institution ${suffix}`,
            degree: 'Degree',
            startYear: 2026,
            current: true,
            endYear: 2026,
            displayOrder: 0,
          },
        }),
      'Education_current_endYear_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.experience.create({
          data: {
            company: `Invalid ordered company ${suffix}`,
            role: 'Developer',
            startMonth: '2026-01',
            current: true,
            description: 'Invalid ordered experience',
            displayOrder: -1,
          },
        }),
      'Experience_displayOrder_nonnegative_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.education.create({
          data: {
            institution: `Invalid ordered institution ${suffix}`,
            degree: 'Degree',
            startYear: 2026,
            current: true,
            displayOrder: -1,
          },
        }),
      'Education_displayOrder_nonnegative_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.certification.create({
          data: {
            name: `Invalid certification ${suffix}`,
            issuingOrganization: 'Invariant tests',
            issueYear: 2026,
            displayOrder: -1,
          },
        }),
      'Certification_displayOrder_nonnegative_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.service.create({
          data: {
            name: `Invalid service ${suffix}`,
            description: 'Invalid service',
            displayOrder: -1,
          },
        }),
      'Service_displayOrder_nonnegative_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.project.create({
          data: {
            title: `Invalid project ${suffix}`,
            slug: `invalid-project-${suffix}`,
            description: 'Invalid project',
            displayOrder: -1,
          },
        }),
      'Project_displayOrder_nonnegative_check',
    )
  })

  it('AC-1 rejects current experience and education records with end values', async () => {
    const suffix = randomUUID()

    await expectConstraintViolation(
      () =>
        prisma.experience.create({
          data: {
            company: `Current company ${suffix}`,
            role: 'Developer',
            startMonth: '2026-01',
            current: true,
            endMonth: '2026-12',
            description: 'Invalid current experience',
            displayOrder: 0,
          },
        }),
      'Experience_current_endMonth_check',
    )

    await expectConstraintViolation(
      () =>
        prisma.education.create({
          data: {
            institution: `Current institution ${suffix}`,
            degree: 'Degree',
            startYear: 2026,
            current: false,
            endYear: null,
            displayOrder: 0,
          },
        }),
      'Education_current_endYear_check',
    )
  })

  it('AC-1 accepts zero ordered values and valid current or completed records', async () => {
    const suffix = randomUUID()
    const createdIds = {
      skill: '',
      currentExperience: '',
      completedExperience: '',
      currentEducation: '',
      completedEducation: '',
      certification: '',
      service: '',
      project: '',
    }

    try {
      createdIds.skill = (
        await prisma.skill.create({
          data: {
            name: `Valid skill ${suffix}`,
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      createdIds.currentExperience = (
        await prisma.experience.create({
          data: {
            company: `Current company ${suffix}`,
            role: 'Developer',
            startMonth: '2026-01',
            current: true,
            description: 'Valid current experience',
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      createdIds.completedExperience = (
        await prisma.experience.create({
          data: {
            company: `Completed company ${suffix}`,
            role: 'Developer',
            startMonth: '2025-01',
            current: false,
            endMonth: '2025-12',
            description: 'Valid completed experience',
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      createdIds.currentEducation = (
        await prisma.education.create({
          data: {
            institution: `Current institution ${suffix}`,
            degree: 'Degree',
            startYear: 2026,
            current: true,
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      createdIds.completedEducation = (
        await prisma.education.create({
          data: {
            institution: `Completed institution ${suffix}`,
            degree: 'Degree',
            startYear: 2025,
            current: false,
            endYear: 2026,
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      createdIds.certification = (
        await prisma.certification.create({
          data: {
            name: `Valid certification ${suffix}`,
            issuingOrganization: 'Invariant tests',
            issueYear: 2026,
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      createdIds.service = (
        await prisma.service.create({
          data: {
            name: `Valid service ${suffix}`,
            description: 'Valid service',
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      createdIds.project = (
        await prisma.project.create({
          data: {
            title: `Valid project ${suffix}`,
            slug: `valid-project-${suffix}`,
            description: 'Valid project',
            displayOrder: 0,
          },
          select: { id: true },
        })
      ).id

      expect(Object.values(createdIds).every(Boolean)).toBe(true)
    } finally {
      await prisma.project.deleteMany({ where: { id: createdIds.project } })
      await prisma.service.deleteMany({ where: { id: createdIds.service } })
      await prisma.certification.deleteMany({
        where: { id: createdIds.certification },
      })
      await prisma.education.deleteMany({
        where: {
          id: {
            in: [createdIds.currentEducation, createdIds.completedEducation],
          },
        },
      })
      await prisma.experience.deleteMany({
        where: {
          id: {
            in: [createdIds.currentExperience, createdIds.completedExperience],
          },
        },
      })
      await prisma.skill.deleteMany({ where: { id: createdIds.skill } })
    }
  })
})
