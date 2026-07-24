import { HttpStatus, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { Express } from 'express'
import { AppModule } from './app.module'
import {
  configureTrustProxy,
  type TrustProxyConfigurable,
} from './common/config/trust-proxy'
import { requestIdMiddleware } from './common/http/request-id.middleware'
import { ProblemDetailsFilter } from './common/http/problem-details.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  })
  const expressApp = app.getHttpAdapter().getInstance() as Express &
    TrustProxyConfigurable
  configureTrustProxy(expressApp)

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

  const port = Number(process.env.PORT) || 3001

  await app.listen(port)
}

void bootstrap()
