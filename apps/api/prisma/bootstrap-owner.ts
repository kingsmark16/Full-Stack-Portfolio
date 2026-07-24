import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { PrismaNeon } from '@prisma/adapter-neon'
import { hashPassword } from 'better-auth/crypto'
import { PrismaClient } from '../generated/prisma/client'

const databaseUrl = process.env.DATABASE_URL
const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase() ?? ''
const ownerName = process.env.OWNER_NAME?.trim() || 'MC.ANGHEL Owner'
const ownerPassword = process.env.OWNER_PASSWORD ?? ''

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

if (!ownerEmail || !ownerPassword) {
  throw new Error('OWNER_EMAIL and OWNER_PASSWORD are required')
}

if (ownerPassword.length < 12) {
  throw new Error('OWNER_PASSWORD must be at least 12 characters')
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
})

async function main(): Promise<void> {
  const existingOwner = await prisma.ownerAccess.findUnique({
    where: { singletonKey: 1 },
    include: { user: true },
  })

  if (existingOwner) {
    if (existingOwner.user.email !== ownerEmail) {
      throw new Error(
        `Owner access already belongs to ${existingOwner.user.email}`,
      )
    }

    console.log('Owner access is already bootstrapped.')
    return
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: ownerEmail },
  })

  if (existingUser) {
    throw new Error(
      `A Better Auth user already exists for ${ownerEmail}; refusing to claim it automatically.`,
    )
  }

  const now = new Date()
  const userId = randomUUID()
  const passwordHash = await hashPassword(ownerPassword)

  await prisma.$transaction(async (transaction) => {
    await transaction.user.create({
      data: {
        id: userId,
        name: ownerName,
        email: ownerEmail,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: userId,
            providerId: 'credential',
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    })

    await transaction.ownerAccess.create({
      data: {
        singletonKey: 1,
        userId,
        createdAt: now,
        updatedAt: now,
      },
    })
  })

  console.log(`Owner access bootstrapped for ${ownerEmail}.`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
