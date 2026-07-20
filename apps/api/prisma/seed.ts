import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not configure')
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
})

async function main(): Promise<void> {
  console.log('Seeding profile...')
  const existingProfile = await prisma.profile.findUnique({
    where: { singletonKey: 'default' },
  })

  if (existingProfile) {
    await prisma.profile.update({
      where: { id: existingProfile.id },
      data: { published: true },
    })
  } else {
    await prisma.profile.create({
      data: {
        singletonKey: 'default',
        name: 'Mark Angel',
        biography: 'Full stack developer building useful web experiences.',
        contactEmail: 'owner@gmail.com',
        published: true,
        phoneNumber: '09694451271',
      },
    })
  }
  console.log('Profile ready.')

  const skills = []
  for (const data of [
    {
      name: 'TypeScript',
      iconUrl: 'https://cdn.simpleicons.org/typescript',
      displayOrder: 1,
    },
    {
      name: 'Next.js',
      iconUrl: 'https://cdn.simpleicons.org/nextdotjs',
      displayOrder: 2,
    },
    {
      name: 'NestJS',
      iconUrl: 'https://cdn.simpleicons.org/nestjs',
      displayOrder: 3,
    },
    {
      name: 'PostgreSQL',
      iconUrl: 'https://cdn.simpleicons.org/postgresql',
      displayOrder: 4,
    },
    {
      name: 'Prisma',
      iconUrl: 'https://cdn.simpleicons.org/prisma',
      displayOrder: 5,
    },
    {
      name: 'Playwright',
      iconUrl: 'https://cdn.simpleicons.org/playwright',
      displayOrder: 6,
    },
  ]) {
    const existing = await prisma.skill.findFirst({
      where: { name: data.name },
    })

    skills.push(
      existing
        ? await prisma.skill.update({
            where: { id: existing.id },
            data: { ...data, published: true },
          })
        : await prisma.skill.create({ data: { ...data, published: true } }),
    )
  }
  console.log('Skills ready.')

  for (const data of [
    {
      name: 'Product-minded engineering',
      description:
        'Turn ambiguous ideas into focused, maintainable product slices.',
      displayOrder: 1,
    },
    {
      name: 'Frontend systems',
      description:
        'Build accessible, responsive interfaces with a clear visual language.',
      displayOrder: 2,
    },
    {
      name: 'Backend APIs',
      description:
        'Design dependable APIs with validation, observability, and tests.',
      displayOrder: 3,
    },
  ]) {
    const existing = await prisma.service.findFirst({
      where: { name: data.name },
    })

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { ...data, published: true },
      })
    } else {
      await prisma.service.create({ data: { ...data, published: true } })
    }
  }
  console.log('Services ready.')

  const experience = await prisma.experience.findFirst({
    where: { company: 'Independent practice', role: 'Full stack developer' },
  })
  if (experience) {
    await prisma.experience.update({
      where: { id: experience.id },
      data: { published: true, displayOrder: 1 },
    })
  } else {
    await prisma.experience.create({
      data: {
        company: 'Independent practice',
        role: 'Full stack developer',
        location: 'Remote',
        startMonth: '2024-01',
        current: true,
        description:
          'Building full stack portfolio and product experiments from idea to delivery.',
        displayOrder: 1,
        published: true,
      },
    })
  }

  const education = await prisma.education.findFirst({
    where: {
      institution: 'Self-directed learning',
      degree: 'Software engineering',
    },
  })
  if (education) {
    await prisma.education.update({
      where: { id: education.id },
      data: { published: true, displayOrder: 1 },
    })
  } else {
    await prisma.education.create({
      data: {
        institution: 'Self-directed learning',
        degree: 'Software engineering',
        location: 'Remote',
        startYear: 2022,
        current: true,
        displayOrder: 1,
        published: true,
      },
    })
  }

  const certification = await prisma.certification.findFirst({
    where: { name: 'Modern full stack delivery' },
  })
  if (certification) {
    await prisma.certification.update({
      where: { id: certification.id },
      data: { published: true, displayOrder: 1 },
    })
  } else {
    await prisma.certification.create({
      data: {
        name: 'Modern full stack delivery',
        issuingOrganization: 'Portfolio Lab',
        issueYear: 2026,
        credentialUrl:
          'https://example.com/credentials/modern-full-stack-delivery',
        displayOrder: 1,
        published: true,
      },
    })
  }

  const [typescript, nextjs, nestjs, postgresql, prismaSkill, playwright] =
    skills

  await prisma.project.upsert({
    where: { slug: 'full-stack-portfolio' },
    update: {
      published: true,
      displayOrder: 1,
      skills: {
        deleteMany: {},
        create: [
          typescript,
          nextjs,
          nestjs,
          postgresql,
          prismaSkill,
          playwright,
        ].map(({ id: skillId }) => ({ skill: { connect: { id: skillId } } })),
      },
    },
    create: {
      title: 'Full Stack Portfolio',
      slug: 'full-stack-portfolio',
      description:
        'A data-backed portfolio with a cyber noir interface, resilient APIs, and a tested contact flow.',
      imageUrl:
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      projectUrl: 'https://example.com/projects/full-stack-portfolio',
      repositoryUrl: 'https://github.com/kingsmark16/Full-Stack-Portfolio',
      startMonth: '2026-07',
      displayOrder: 1,
      published: true,
      skills: {
        create: [
          typescript,
          nextjs,
          nestjs,
          postgresql,
          prismaSkill,
          playwright,
        ].map(({ id: skillId }) => ({ skill: { connect: { id: skillId } } })),
      },
    },
  })

  await prisma.project.upsert({
    where: { slug: 'developer-workflow-toolkit' },
    update: {
      published: true,
      displayOrder: 2,
      skills: {
        deleteMany: {},
        create: [typescript, nextjs, playwright].map(({ id: skillId }) => ({
          skill: { connect: { id: skillId } },
        })),
      },
    },
    create: {
      title: 'Developer Workflow Toolkit',
      slug: 'developer-workflow-toolkit',
      description:
        'A small collection of quality gates and reusable patterns for shipping confidently.',
      imageUrl:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      projectUrl: 'https://example.com/projects/developer-workflow-toolkit',
      repositoryUrl: 'https://github.com/kingsmark16/Full-Stack-Portfolio',
      startMonth: '2025-10',
      endMonth: '2026-02',
      displayOrder: 2,
      published: true,
      skills: {
        create: [typescript, nextjs, playwright].map(({ id: skillId }) => ({
          skill: { connect: { id: skillId } },
        })),
      },
    },
  })

  console.log('Development portfolio fixtures are ready.')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
