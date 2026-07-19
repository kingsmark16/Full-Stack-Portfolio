import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from './../src/app.module'
import {
  configureTrustProxy,
  type TrustProxyConfigurable,
} from './../src/common/config/trust-proxy'
import { ProblemDetailsFilter } from './../src/common/http/problem-details.filter'
import { requestIdMiddleware } from './../src/common/http/request-id.middleware'
import type { Express } from 'express'
import { randomUUID } from 'node:crypto'
import { PrismaService } from './../src/prisma/prisma.service'

type PublicPortfolioResponse = {
  projects: Array<{
    slug: string
    skills: Array<{ name: string; iconUrl: string | null }>
  }>
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    const expressApp = app.getHttpAdapter().getInstance() as Express &
      TrustProxyConfigurable
    configureTrustProxy(expressApp, '1')

    app.use(requestIdMiddleware)
    app.useGlobalFilters(new ProblemDetailsFilter())
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    )
    await app.init()
    prisma = app.get(PrismaService)
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!')
  })

  it('returns Problem Details for unknown routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/does-not-exist')
      .expect(404)
      .expect('Content-Type', /application\/problem\+json/)

    expect(response.headers['x-request-id']).toBeDefined()
    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'REQUEST_FAILED',
        requestId: response.headers['x-request-id'],
      }),
    )
  })

  it('returns a portfolio not found problem when the profile is unpublished', async () => {
    const profile = await prisma.profile.findUnique({
      where: { singletonKey: 'default' },
      select: { published: true },
    })

    if (!profile) {
      throw new Error('The default profile is required for this test')
    }

    await prisma.profile.update({
      where: { singletonKey: 'default' },
      data: { published: false },
    })

    try {
      const response = await request(app.getHttpServer())
        .get('/portfolio')
        .expect(404)
        .expect('Content-Type', /application\/problem\+json/)

      expect(response.body).toEqual(
        expect.objectContaining({
          status: 404,
          code: 'PORTFOLIO_NOT_PUBLISHED',
        }),
      )
    } finally {
      await prisma.profile.update({
        where: { singletonKey: 'default' },
        data: { published: profile.published },
      })
    }
  })

  it('excludes unpublished skills linked to a published project', async () => {
    const suffix = randomUUID()
    const publishedSkill = await prisma.skill.create({
      data: {
        name: `Published Skill ${suffix}`,
        displayOrder: 1,
        published: true,
      },
    })
    const unpublishedSkill = await prisma.skill.create({
      data: {
        name: `Unpublished Skill ${suffix}`,
        displayOrder: 2,
        published: false,
      },
    })
    const project = await prisma.project.create({
      data: {
        title: `Public Project ${suffix}`,
        slug: `public-project-${suffix}`,
        description: 'A public project used for integration coverage.',
        published: true,
        skills: {
          create: [
            { skill: { connect: { id: publishedSkill.id } } },
            { skill: { connect: { id: unpublishedSkill.id } } },
          ],
        },
      },
    })

    try {
      const response = await request(app.getHttpServer())
        .get('/portfolio')
        .expect(200)

      const body = response.body as unknown as PublicPortfolioResponse

      expect(body.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            slug: project.slug,
            skills: [
              {
                name: publishedSkill.name,
                iconUrl: null,
              },
            ],
          }),
        ]),
      )
    } finally {
      await prisma.project.delete({ where: { id: project.id } })
      await prisma.skill.deleteMany({
        where: { id: { in: [publishedSkill.id, unpublishedSkill.id] } },
      })
    }
  })

  it('accepts a valid contact submission', async () => {
    const idempotencyKey = `contact-e2e-${randomUUID()}`
    const payload = {
      name: 'E2E Visitor',
      email: 'e2e@example.com',
      message: 'This is an end to end contact test.',
      honeypot: '',
    }

    await request(app.getHttpServer())
      .post('/contact')
      .set('Idempotency-Key', idempotencyKey)
      .send(payload)
      .expect(202)
      .expect('Content-Type', /json/)
      .expect({ accepted: true })

    const persistedMessage = (await prisma.contactMessage.findUnique({
      where: { idempotencyKey },
      include: { emailOutbox: true },
    })) as {
      idempotencyKey: string
      name: string
      email: string
      message: string
      emailOutbox: {
        deduplicationKey: string
        status: string
      } | null
    } | null

    expect(persistedMessage).not.toBeNull()
    expect(persistedMessage?.idempotencyKey).toBe(idempotencyKey)
    expect(persistedMessage?.name).toBe(payload.name)
    expect(persistedMessage?.email).toBe(payload.email)
    expect(persistedMessage?.message).toBe(payload.message)
    expect(persistedMessage?.emailOutbox).toEqual(
      expect.objectContaining({
        deduplicationKey: `contact:${idempotencyKey}`,
        status: 'QUEUED',
      }),
    )
  })

  it('accepts a retry with the same idempotency key', async () => {
    const idempotencyKey = `contact-retry-${randomUUID()}`
    const payload = {
      name: 'Retry Visitor',
      email: 'retry@example.com',
      message: 'This request will be retried.',
      honeypot: '',
    }

    await request(app.getHttpServer())
      .post('/contact')
      .set('Idempotency-Key', idempotencyKey)
      .send(payload)
      .expect(202)
      .expect({ accepted: true })

    await request(app.getHttpServer())
      .post('/contact')
      .set('Idempotency-Key', idempotencyKey)
      .send(payload)
      .expect(202)
      .expect({ accepted: true })
  })
  it('accepts a filled honeypot without persisting the message', async () => {
    const idempotencyKey = `contact-honeypot-${randomUUID()}`

    await request(app.getHttpServer())
      .post('/contact')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        name: 'Bot Visitor',
        email: 'bot@example.com',
        message: 'Automated message.',
        honeypot: 'filled-by-bot',
      })
      .expect(202)
      .expect({ accepted: true })

    await expect(
      prisma.contactMessage.findUnique({
        where: { idempotencyKey },
      }),
    ).resolves.toBeNull()
  })
  it('rejects invalid contact data', async () => {
    const response = await request(app.getHttpServer())
      .post('/contact')
      .send({
        name: '',
        email: 'not-an-email',
        message: '',
        honeypot: '',
      })
      .expect(422)
      .expect('Content-Type', /application\/problem\+json/)

    expect(response.headers['x-request-id']).toBeDefined()
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 422,
        code: 'VALIDATION_FAILED',
        requestId: response.headers['x-request-id'],
      }),
    )
  })

  it('rejects a missing idempotency key', async () => {
    const response = await request(app.getHttpServer())
      .post('/contact')
      .send({
        name: 'Missing Key Visitor',
        email: 'missing-key@example.com',
        message: 'This request has no idempotency key.',
        honeypot: '',
      })
      .expect(422)
      .expect('Content-Type', /application\/problem\+json/)

    expect(response.body).toEqual(
      expect.objectContaining({
        status: 422,
        code: 'VALIDATION_FAILED',
      }),
    )
  })

  it('AC-6 rate limits the sixth contact submission from one IP', async () => {
    const statuses: number[] = []

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await request(app.getHttpServer())
        .post('/contact')
        .set('Idempotency-Key', `contact-limit-${randomUUID()}`)
        .send({
          name: `Rate Limit Visitor ${attempt}`,
          email: `rate-limit-${attempt}@example.com`,
          message: 'This request checks the contact rate limit.',
          honeypot: '',
        })

      statuses.push(response.status)
    }

    expect(statuses.slice(0, 5)).toEqual([202, 202, 202, 202, 202])
    expect(statuses[5]).toBe(429)
  }, 30_000)

  it('AC-6 separates client IPs behind one trusted proxy', async () => {
    const firstClientAddress = '198.51.100.10'
    const secondClientAddress = '198.51.100.11'

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/contact')
        .set('X-Forwarded-For', firstClientAddress)
        .set('Idempotency-Key', `forwarded-limit-${randomUUID()}`)
        .send({
          name: `Forwarded Visitor ${attempt}`,
          email: `forwarded-${attempt}@example.com`,
          message: 'This request checks trusted proxy rate limits.',
          honeypot: 'filled-by-test',
        })
        .expect(202)
    }

    await request(app.getHttpServer())
      .post('/contact')
      .set('X-Forwarded-For', firstClientAddress)
      .set('Idempotency-Key', `forwarded-limit-${randomUUID()}`)
      .send({
        name: 'Forwarded Limited Visitor',
        email: 'forwarded-limited@example.com',
        message: 'This request should be rate limited.',
        honeypot: 'filled-by-test',
      })
      .expect(429)

    await request(app.getHttpServer())
      .post('/contact')
      .set('X-Forwarded-For', secondClientAddress)
      .set('Idempotency-Key', `forwarded-limit-${randomUUID()}`)
      .send({
        name: 'Forwarded Separate Visitor',
        email: 'forwarded-separate@example.com',
        message: 'This request should use a separate bucket.',
        honeypot: 'filled-by-test',
      })
      .expect(202)
  })

  it('AC-6 ignores spoofed forwarded IPs when no proxy is trusted', async () => {
    const expressApp = app.getHttpAdapter().getInstance() as Express &
      TrustProxyConfigurable
    configureTrustProxy(expressApp, '0')

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/contact')
        .set('X-Forwarded-For', `198.51.100.${attempt + 20}`)
        .set('Idempotency-Key', `spoofed-limit-${randomUUID()}`)
        .send({
          name: `Spoofed Visitor ${attempt}`,
          email: `spoofed-${attempt}@example.com`,
          message: 'This request checks untrusted forwarded headers.',
          honeypot: 'filled-by-test',
        })
        .expect(202)
    }

    await request(app.getHttpServer())
      .post('/contact')
      .set('X-Forwarded-For', '198.51.100.99')
      .set('Idempotency-Key', `spoofed-limit-${randomUUID()}`)
      .send({
        name: 'Spoofed Limited Visitor',
        email: 'spoofed-limited@example.com',
        message: 'This request should be rate limited.',
        honeypot: 'filled-by-test',
      })
      .expect(429)
  })

  afterEach(async () => {
    await app.close()
  })
})
