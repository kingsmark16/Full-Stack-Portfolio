import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from './../src/app.module'
import { ProblemDetailsFilter } from './../src/common/http/problem-details.filter'
import { requestIdMiddleware } from './../src/common/http/request-id.middleware'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.use(requestIdMiddleware)
    app.useGlobalFilters(new ProblemDetailsFilter())
    await app.init()
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

  afterEach(async () => {
    await app.close()
  })
})
