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
  const existingProfile = await prisma.profile.findUnique({
    where: { singletonKey: 'default' },
  })

  if (!existingProfile) {
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

    console.log('Development profile created.')
  } else {
    console.log('Development profile already exists.')
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
