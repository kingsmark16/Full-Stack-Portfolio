import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from './../src/app.module'
import { ProblemDetailsFilter } from './../src/common/http/problem-details.filter'
import { requestIdMiddleware } from './../src/common/http/request-id.middleware'
import { randomUUID } from 'node:crypto'
import { PrismaService } from './../src/prisma/prisma.service'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>
  let prisma: PrismaService

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

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
  })

  afterEach(async () => {
    await app.close()
  })
})
