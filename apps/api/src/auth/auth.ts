import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'
import { PrismaClient } from '../../generated/prisma/client'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { betterAuth } from 'better-auth/minimal'

const isProduction = process.env.NODE_ENV === 'production'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured')
}

const secret =
  process.env.BETTER_AUTH_SECRET ??
  (isProduction ? undefined : 'owner-access-development-secret-change-me')

if (!secret) {
  throw new Error('BETTER_AUTH_SECRET is required in production')
}

if (secret.length < 32) {
  throw new Error('BETTER_AUTH_SECRET must be at least 32 characters')
}

const baseURL =
  process.env.BETTER_AUTH_URL ??
  (isProduction ? undefined : 'http://localhost:3001')

if (!baseURL) {
  throw new Error('BETTER_AUTH_URL is required in production')
}

if (isProduction && !baseURL.startsWith('https://')) {
  throw new Error('BETTER_AUTH_URL must use HTTPS in production')
}

const trustedOrigins = (
  process.env.AUTH_TRUSTED_ORIGINS ??
  'http://localhost:3000,http://localhost:3001'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
})

export const auth = betterAuth({
  appName: 'MC.ANGHEL Owner Access',
  baseURL,
  secret,
  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: false,
    },
  },

  rateLimit: {
    enabled: true,
    storage: 'database',
    modelName: 'rateLimit',
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': {
        window: 60 * 15,
        max: 10,
      },
    },
  },

  user: {
    changeEmail: {
      enabled: false,
    },
    deleteUser: {
      enabled: false,
    },
  },

  account: {
    accountLinking: {
      enabled: false,
    },
  },

  advanced: {
    useSecureCookies: isProduction,
    cookiePrefix: 'mcanghel',
    defaultCookieAttributes: {
      sameSite: 'lax',
      path: '/',
    },
  },
})
